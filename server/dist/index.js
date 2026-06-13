"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./db/db"));
const port = process.env.PORT;
(0, db_1.default)()
    .then(() => {
    app_1.default.listen(port, () => {
        console.log('Server is started on http://localhost:5000/');
    });
})
    .catch((err) => {
    console.log('MongoDB connection error', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map