"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageTier = exports.StreamStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["OPERATOR"] = "operator";
    UserRole["VIEWER"] = "viewer";
    UserRole["API_ONLY"] = "api_only";
})(UserRole || (exports.UserRole = UserRole = {}));
var StreamStatus;
(function (StreamStatus) {
    StreamStatus["ONLINE"] = "online";
    StreamStatus["OFFLINE"] = "offline";
    StreamStatus["CONNECTING"] = "connecting";
    StreamStatus["ERROR"] = "error";
})(StreamStatus || (exports.StreamStatus = StreamStatus = {}));
var StorageTier;
(function (StorageTier) {
    StorageTier["HOT"] = "hot";
    StorageTier["WARM"] = "warm";
    StorageTier["COLD"] = "cold";
})(StorageTier || (exports.StorageTier = StorageTier = {}));
