class RouteStore {
    /**
     * @param id
     * @param path
     */
    static add(id, path) {
        if(id && path) {
            RouteStore.constructor.route_list[id] = path;
        }
    }

    /**
     * @param id
     * @return {string}
     */
    static get(id) {
        if(id && RouteStore.constructor.route_list[id] && RouteStore.constructor.route_list[id].any) {
            return RouteStore.constructor.route_list[id].any;
        } else {
            throw new Error('RouteStore: get with unkown id: ' + id);
        }
    }
}

if('undefined' === typeof RouteStore.constructor.route_list) {
    RouteStore.constructor.route_list = {};
}

export default RouteStore;