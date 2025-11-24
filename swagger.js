import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SOP Info API",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                },
            },
        },
    },
    apis: ["./routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app) {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
