"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSchema = importSchema;
const fs_1 = require("fs");
const graphql_1 = require("graphql");
const path_1 = __importDefault(require("path"));
function importSchema() {
    // const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    // const __dirname = path.dirname(__filename); // get the name of the directory
    // Load and parse schema from file
    const schemaString = (0, fs_1.readFileSync)(`${path_1.default.join(__dirname, 'schema.gql')}`, 'utf8');
    return (0, graphql_1.buildSchema)(schemaString);
}
