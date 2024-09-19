"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
exports.resolvers = {
    health() {
        return 'health+1+2';
    },
    findAllGroupsOfUser(_, name) {
        return name;
    },
};
