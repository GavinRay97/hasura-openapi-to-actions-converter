export const dereferencedSpec = {
    openapi: "3.0.2",
    info: { title: "FastAPI", version: "0.1.0" },
    paths: {
        "/login": {
            post: {
                summary: "Login",
                operationId: "login_login_post",
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                title: "AuthInput",
                                required: ["email", "password"],
                                type: "object",
                                properties: {
                                    email: { title: "Email", type: "string" },
                                    password: { title: "Password", type: "string" },
                                },
                            },
                        },
                    },
                    required: true,
                },
                responses: {
                    "200": {
                        description: "Successful Response",
                        content: {
                            "application/json": {
                                schema: {
                                    title: "AuthToken",
                                    required: ["token"],
                                    type: "object",
                                    properties: { token: { title: "Token", type: "string" } },
                                },
                            },
                        },
                    },
                    "422": {
                        description: "Validation Error",
                        content: {
                            "application/json": {
                                schema: {
                                    title: "HTTPValidationError",
                                    type: "object",
                                    properties: {
                                        detail: {
                                            title: "Detail",
                                            type: "array",
                                            items: {
                                                title: "ValidationError",
                                                required: ["loc", "msg", "type"],
                                                type: "object",
                                                properties: {
                                                    loc: {
                                                        title: "Location",
                                                        type: "array",
                                                        items: { type: "string" },
                                                    },
                                                    msg: { title: "Message", type: "string" },
                                                    type: { title: "Error Type", type: "string" },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            AuthInput: {
                title: "AuthInput",
                required: ["email", "password"],
                type: "object",
                properties: {
                    email: { title: "Email", type: "string" },
                    password: { title: "Password", type: "string" },
                },
            },
            AuthToken: {
                title: "AuthToken",
                required: ["token"],
                type: "object",
                properties: { token: { title: "Token", type: "string" } },
            },
            HTTPValidationError: {
                title: "HTTPValidationError",
                type: "object",
                properties: {
                    detail: {
                        title: "Detail",
                        type: "array",
                        items: {
                            title: "ValidationError",
                            required: ["loc", "msg", "type"],
                            type: "object",
                            properties: {
                                loc: {
                                    title: "Location",
                                    type: "array",
                                    items: { type: "string" },
                                },
                                msg: { title: "Message", type: "string" },
                                type: { title: "Error Type", type: "string" },
                            },
                        },
                    },
                },
            },
            ValidationError: {
                title: "ValidationError",
                required: ["loc", "msg", "type"],
                type: "object",
                properties: {
                    loc: {
                        title: "Location",
                        type: "array",
                        items: { type: "string" },
                    },
                    msg: { title: "Message", type: "string" },
                    type: { title: "Error Type", type: "string" },
                },
            },
        },
    },
}
