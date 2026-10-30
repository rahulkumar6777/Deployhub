import { body, param } from "express-validator";
import net from "node:net";

export const addNodeValidator = [
    body("nodeId")
        .trim()
        .notEmpty()
        .withMessage("Node ID is required")
        .isString()
        .withMessage("Node ID must be a String"),
    body('nodetype')
        .trim()
        .notEmpty()
        .withMessage("nodetype is Required")
        .toLowerCase()
        .custom((value) => {
            if (value !== 'build' & value !== 'deploy') {
                throw new Error("invalid nodetype");
            }
            return true;
        }),
    body("regionId")
        .trim()
        .notEmpty()
        .withMessage("Region ID is required")
        .isMongoId()
        .withMessage('Region ID must be a valid MongoDB ObjectId'),

    body("httpPortRangeStart")
        .notEmpty()
        .withMessage("HTTP port range start is required")
        .isInt({ min: 1024, max: 65535 })
        .withMessage("HTTP port range start must be between 1024 and 65535")
        .toInt(),

    body("httpPortRangeEnd")
        .notEmpty()
        .withMessage("HTTP port range end is required")
        .isInt({ min: 1024, max: 65535 })
        .withMessage("HTTP port range end must be between 1024 and 65535")
        .toInt()
        .custom((value, { req }) => {
            if (value < req.body.httpPortRangeStart) {
                throw new Error(
                    "HTTP port range end must be greater than or equal to start"
                );
            }
            return true;
        }),

    body("nodeIp")
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .custom((value) => {
            if (!net.isIP(value)) {
                throw new Error("Node IP must be a valid IPv4 or IPv6 address");
            }
            return true;
        }),

    body("nodeUrl")
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage("Node URL must be a valid HTTP or HTTPS URL"),

    body("cpuTotalPercent")
        .custom((value, { req }) => {
            if (req.body.nodetype === "deploy") {
                if (value === undefined || value === null) {
                    throw new Error("CPU total percentage is required");
                }
            }
            return true;
        })
        .optional()
        .isFloat({ min: 100, max: 1000000 })
        .withMessage("CPU total percentage must be between 100 and 1000000")
        .toFloat(),

    body("memoryTotalBytes")
        .custom((value, { req }) => {
            if (req.body.nodetype === "deploy") {
                if (value === undefined || value === null) {
                    throw new Error("Total memory is required");
                }
            }
            return true;
        })
        .optional()
        .isInt({ min: 1 })
        .withMessage("Total memory must be a positive integer")
        .toInt(),

    body("diskTotalBytes")
        .custom((value, { req }) => {
            if (req.body.nodetype === "deploy") {
                if (value === undefined || value === null) {
                    throw new Error("Total disk size is required");
                }
            }
            return true;
        })
        .optional()
        .isInt({ min: 1 })
        .withMessage("Total disk size must be a positive integer")
        .toInt(),
];

export const nodeVerifyValidator = [
    param('id')
        .notEmpty()
        .withMessage('nodeId is required')
        .isString()
        .withMessage('nodeId must be a string'),
    body('secret')
        .notEmpty()
        .withMessage('secret is required')
        .isString()
        .withMessage('secret must be a string'),
    body("resources.cpu.cores")
        .optional()
        .isNumeric()
        .withMessage("cpu.cores must be a number"),

    body("resources.cpu.usagePercent")
        .optional()
        .isNumeric()
        .withMessage("cpu.usagePercent must be a number"),

    body("resources.memory.totalBytes")
        .optional()
        .isNumeric()
        .withMessage("memory.totalBytes must be a number"),

    body("resources.memory.usedBytes")
        .optional()
        .isNumeric()
        .withMessage("memory.usedBytes must be a number"),

    body("resources.disk.totalBytes")
        .optional()
        .isNumeric()
        .withMessage("disk.totalBytes must be a number"),

    body("resources.disk.usedBytes")
        .optional()
        .isNumeric()
        .withMessage("disk.usedBytes must be a number"),
]

export const getNodebyRegionCodeValidator = [
    param('regioncode')
        .notEmpty()
        .withMessage('Region code is required')
        .isString()
        .withMessage('Region code must be a string')
];



export const getNodeByIdValidator = [
    param("id")
        .trim()
        .notEmpty()
        .withMessage("nodeid ID is required")
        .isMongoId()
        .withMessage('nodeid ID must be a valid MongoDB ObjectId'),
]
