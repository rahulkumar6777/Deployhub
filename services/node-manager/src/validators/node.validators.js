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
        .notEmpty()
        .withMessage("CPU total percentage is required")
        .isFloat({ min: 100, max: 1000000 })
        .withMessage("CPU total percentage must be between 0 and 100")
        .toFloat(),

    body("memoryTotalBytes")
        .notEmpty()
        .withMessage("Total memory is required")
        .isInt({ min: 1 })
        .withMessage("Total memory must be a positive integer")
        .toInt(),

    body("diskTotalBytes")
        .notEmpty()
        .withMessage("Total disk size is required")
        .isInt({ min: 1 })
        .withMessage("Total disk size must be a positive integer")
        .toInt(),
];

export const getNodebyRegionCodeValidator = [
    param('regioncode')
        .notEmpty()
        .withMessage('Region code is required')
        .isString()
        .withMessage('Region code must be a string')
];

export const suggestNodeValidator = [
    body("nodeType")
        .trim()
        .notEmpty()
        .withMessage("Node type is required")
        .isIn(["build", "deploy"])
        .withMessage("Node type must be build or deploy"),

    body("cpuPercent")
        .if((value, { req }) => req.body.nodeType === "deploy")
        .notEmpty()
        .withMessage("CPU requirement is required")
        .isFloat({ min: 0 })
        .withMessage("CPU requirement must be a positive number")
        .toFloat(),

    body("memoryBytes")
        .if((value, { req }) => req.body.nodeType === "deploy")
        .notEmpty()
        .withMessage("Memory requirement in bytes is required")
        .isInt({ min: 0 })
        .withMessage("Memory requirement must be a positive number")
        .toInt(),

    body("storageBytes")
        .if((value, { req }) => req.body.nodeType === "deploy")
        .notEmpty()
        .withMessage("Storage requirement in bytes is required")
        .isInt({ min: 0 })
        .withMessage("Storage requirement must be a positive number")
        .toInt()
];

export const confirmNodeAllocationValidator = [
    param("allocationId")
        .trim()
        .notEmpty()
        .withMessage("Allocation ID is required")
        .isMongoId()
        .withMessage("Allocation ID must be a valid MongoDB ObjectId"),

    body("success")
        .isBoolean()
        .withMessage("Success must be true or false")
        .toBoolean()
];


export const getNodeByIdValidator = [
    param("id")
        .trim()
        .notEmpty()
        .withMessage("nodeid ID is required")
        .isMongoId()
        .withMessage('nodeid ID must be a valid MongoDB ObjectId'),
]
