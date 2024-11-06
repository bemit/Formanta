export function renderSystemPage(
    {
        title,
        content,
        severity = 'error',
    }: {
        title: string
        content?: string
        severity?: 'success' | 'info' | 'error' | 'warning'
    },
) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <title>${title}</title>
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --heading-color: #111111;
            --accent-color: #0066cc;
            --border-color: #dddddd;
            --border-radius: 8px;
            --padding: 1rem;

            --success-color: #4caf50;
            --info-color: #2196f3;
            --warning-color: #ff9800;
            --error-color: #f44336;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1e1e1e;
                --text-color: #e0e0e0;
                --heading-color: #ffffff;
                --accent-color: #3399ff;
                --border-color: #333333;

                --success-color: #81c784;
                --info-color: #64b5f6;
                --warning-color: #ffb74d;
                --error-color: #e57373;
            }
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: auto;
            padding: calc(var(--padding) / 2) var(--padding);
        }
        h1, h2, h3, h4, h5, h6 {
            color: var(--heading-color);
            margin-top: 0.125em;
            margin-bottom: 0.5em;
        }
        h1 { font-size: 2rem; }
        h2 { font-size: 1.75rem; }
        h3 { font-size: 1.5rem; }
        p {
            margin-top: 0;
            margin-bottom: 0.25em;
        }
        code {
            font-size: 0.875rem;
        }

        pre {
            white-space: pre-wrap;
            word-wrap: anywhere;
        }

        a {
            color: var(--accent-color);
            text-decoration: none;
            border-bottom: 1px solid var(--accent-color);
        }
        a:hover {
            text-decoration: underline;
        }

        .box {
            padding: calc(var(--padding) / 2) var(--padding);
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
        }

        blockquote {
            /*margin: calc(var(--padding) / 2) var(--padding);*/
            margin: 0;
        }

        /* Severity Styles */
        .severity--success .container {
            border-left: 6px solid var(--success-color);
        }
        .severity--info .container {
            border-left: 6px solid var(--info-color);
        }
        .severity--warning .container {
            border-left: 6px solid var(--warning-color);
        }
        .severity--error .container {
            border-left: 6px solid var(--error-color);
        }

        .severity--success h1, .severity--success a {
            color: var(--success-color);
        }
        .severity--info h1, .severity--info a {
            color: var(--info-color);
        }
        .severity--warning h1, .severity--warning a {
            color: var(--warning-color);
        }
        .severity--error h1, .severity--error a {
            color: var(--error-color);
        }
    </style>
</head>
<body class="severity--${severity}">
    <div class="container">
        <h1>${title}</h1>
        ${content ? '<div class="box">' + content + '</div>' : ''}
    </div>
</body>
</html>`
}
