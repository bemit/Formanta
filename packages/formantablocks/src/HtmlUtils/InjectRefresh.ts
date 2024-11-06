export function injectRefresh(
    content: string | Buffer,
    /**
     * @todo support dynamic slug for stateful UI?
     */
    slug: string,
    ws: { port: number },
    runId?: string,
    generation?: string,
) {
    if (content instanceof Buffer) {
        content = content.toString()
    }
    return content.replace(
        '</body>',
        `<script>
(function() {
  let reconnectAttempts = 0;
  let reconnectAttemptsPoll = 0;
  const maxReconnectDelay = 2500;
  const maxDelayBeforePoll = 400;
  const maxPollDelay = 120000;
  const generationId = ${JSON.stringify(generation || null)};
  const runId = ${JSON.stringify(runId)};
  const slug = ${JSON.stringify(slug)};

  let closingDueToUnload = false;

  window.addEventListener('beforeunload', () => {
    closingDueToUnload = true;
  });

  function connectWebSocket() {
    const ws = new WebSocket('ws://' + location.hostname + ':${ws.port}/' + slug);

    ws.onmessage = function(event) {
      const eventData = JSON.parse(event.data);

      if (eventData.event === 'reload') {
        // todo: fetch latest page and only if changed reload,
        //       or any of its dependencies,
        //       instead of reloading browser unnecessarily
        console.log('Refresh update, fallback to reload.');
        location.reload();
      } else if (eventData.event === 'sync') {
          if (eventData.runId !== runId) {
          console.log('Refresh detected source drift, reload.');
          location.reload();
        } else if (eventData.generationId !== generationId) {
          console.log('Refresh detected content drift, reload.');
          location.reload();
        }
      }
    };

    ws.onopen = function() {
      if (reconnectAttempts > 0) {
        console.log('Refresh reconnected');
        location.reload();
        reconnectAttempts = 0;
      } else {
        console.log('Refresh connected');
      }
    };

    ws.onclose = function() {
      if (closingDueToUnload) return;
      reconnectAttempts++;
      attemptReconnect();
    };

    ws.onerror = function(error) {
      console.error('Refresh WebSocket error:', error);
      ws.close();
    };
  }

  // todo: instead of the long-polling, find a nother mechanism, which seems to require a ServerPush
  //       to inform the client that the server is back online
  async function startLongPolling() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), maxPollDelay);
    try {
      // note: must not use WS port, as then CORS applies
      const response = await fetch('?poll=slug', { signal: controller.signal });
      if (response) { // not checking for .ok, as it should succeed also on 404 etc.
        clearTimeout(timeoutId);
        console.log('Refresh server is back online, switching to WebSocket');
        reconnectAttempts = 0;
        reconnectAttemptsPoll = 0;
        return true;
      }
      // note: long poll with fail with network-connection-refused if server is still offline,
      //       yet for HTTP the error retry is easier and shouldn't be blocked by any browser mechanism
      //       and without more e.g. FF error logs
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Polling failed:', error);
      reconnectAttemptsPoll++;
    }
    return false;
  }

  function attemptReconnect() {
    const reconnectDelay = 50 * Math.pow(2, reconnectAttempts);
    if (reconnectDelay > maxDelayBeforePoll) {
      console.log(\`Refresh reconnect falling back to polling.\`);
      (async() => {
        let reconnected = false;
        do {
            reconnected = await startLongPolling();
            if(!reconnected) {
              const reconnectDelay = Math.min(250 * Math.pow(2, reconnectAttemptsPoll), maxReconnectDelay);
              console.log(\`Refresh reconnect polling failed, waiting \${reconnectDelay / 1000}s before retrying...\`);
              await new Promise((resolve) => setTimeout(resolve, reconnectDelay));
            }
        } while(!reconnected);
        connectWebSocket();
      })().then(() => null);
    } else {
      console.log(\`Refresh reconnecting in \${reconnectDelay / 1000}s...\`);
      setTimeout(connectWebSocket, reconnectDelay);
    }
  }

  connectWebSocket();
})();
</script>
</body>`,
    )
}
