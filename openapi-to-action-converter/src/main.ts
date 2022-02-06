import SwaggerParser from "@apidevtools/swagger-parser"
import assert from "assert"
import dotenv from "dotenv"
import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types"
import path from "path"
import { CustomTypes, InputObjectField, InputObjectType, ObjectType } from "./types/HasuraMetadataV2"
import { ActionV3 } from "./types/HasuraMetadataV3"

dotenv.config({ path: path.join(__dirname, "../", ".env"), debug: true })

async function main() {
    try {
        const filepath = process.env.OPENAPI_SPEC_ENTRYPOINT_FILE_PATH
        assert(filepath, "OPENAPI_SPEC_ENTRYPOINT_FILE_PATH is not set")
        const api = await SwaggerParser.dereference(filepath)
        const definitions = openAPIToActionDefinitions(api)
        console.log("API name: %s, Version: %s", api.info.title, api.info.version)
    } catch (err) {
        console.error(err)
    }
}

function openAPIToActionDefinitions(document: OpenAPI.Document) {
    if ("openapi" in document) {
        return openAPIToActionDefinitionsV3_x(document)
    } else {
        return openAPIToActionDefinitionsV2(document)
    }
}

main()

interface OpenAPIToActionDefinition {
    actions: ActionV3[]
    custom_types: CustomTypes
}

function getOpenAPIV3ApplicationJsonSchemaObject2(
    object: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject | OpenAPIV3.ResponseObject
): OpenAPIV3.SchemaObject | undefined {
    if ("content" in object && object.content) {
        const content = object.content
        if (
            content["application/json"] &&
            content["application/json"].schema &&
            "properties" in content["application/json"].schema
        ) {
            return content["application/json"].schema
        }
    }
    return undefined
}

function getOpenAPIV3ApplicationJsonSchemaObject(
    operation: OpenAPIV3.OperationObject
): OpenAPIV3.SchemaObject | undefined {
    if (operation.requestBody && "content" in operation.requestBody && operation.requestBody.content) {
        const content = operation.requestBody.content
        if (
            content["application/json"] &&
            content["application/json"].schema &&
            "properties" in content["application/json"].schema
        ) {
            return content["application/json"].schema
        }
    }
    return undefined
}

function openAPIV3SchemaToObjectType(schema: OpenAPIV3.SchemaObject): ObjectType | InputObjectType {
    const inputObjectType = {
        name: schema.title as string,
        fields: [] as InputObjectField[],
    }

    for (const key in schema.properties) {
        const property = schema.properties[key]
        if ("$ref" in property) continue
        if (property.type == null) continue
        inputObjectType.fields.push({
            name: key,
            type: openapiTypeToGraphQLType(property.type as OpenAPIV3.NonArraySchemaObjectType),
        })
    }
    return inputObjectType
}

function openAPIToActionDefinitionsV3_x(
    document: OpenAPIV3.Document | OpenAPIV3_1.Document
): OpenAPIToActionDefinition {
    const actions: ActionV3[] = []
    const custom_types = {
        objects: [] as ObjectType[],
        input_objects: [] as InputObjectType[],
    }

    for (const pathname in document.paths) {
        const entry = document.paths[pathname]
        if (entry == null) continue

        for (const method of ["get", "post", "put", "delete"] as const) {
            if (method in entry) {
                const definition = entry[method]

                if (definition == null) continue
                if (definition.operationId == null) {
                    throw new Error(`operationId is not set for ${method} ${pathname}`)
                }

                assert(definition.requestBody != null, "requestBody is empty")
                const requestSchema = getOpenAPIV3ApplicationJsonSchemaObject2(definition.requestBody)
                if (requestSchema == null) continue

                const inputObjectType = openAPIV3SchemaToObjectType(requestSchema)
                custom_types.input_objects.push(inputObjectType)

                const response = definition.responses["200"]
                assert(response != null, "response is not set")
                const responseSchema = getOpenAPIV3ApplicationJsonSchemaObject2(response)
                assert(responseSchema != null, "responseSchema is not set")
                const responseObjectType = openAPIV3SchemaToObjectType(responseSchema)
                custom_types.objects.push(responseObjectType)

                const action: Partial<ActionV3> = {
                    name: pathname.replaceAll("/", ""),
                    definition: {
                        handler: `http://localhost:8000/api${pathname}`,
                        output_type: responseObjectType.name + "!",
                        arguments: [
                            {
                                name: "params",
                                type: inputObjectType.name + "!",
                            },
                        ],
                        request_transform: {
                            body: makeBodyTransformStringFromInputType(inputObjectType),
                            content_type: "application/json",
                            template_engine: "Kriti",
                        },
                        type: method === "get" ? "query" : "mutation",
                        kind: "synchronous",
                    },
                }
                actions.push(action as ActionV3)
            }
        }
    }

    console.dir(
        {
            actions,
            custom_types,
        },
        { depth: null }
    )

    return {} as OpenAPIToActionDefinition
}

function openAPIToActionDefinitionsV2(document: OpenAPIV2.Document): OpenAPIToActionDefinition {
    throw new Error("Function not implemented.")
}

function openapiTypeToGraphQLType(type: OpenAPIV3.NonArraySchemaObjectType): string {
    switch (type) {
        case "integer":
            return "Int!"
        case "number":
            return "Float!"
        case "string":
            return "String!"
        case "boolean":
            return "Boolean!"
        default:
            throw new Error(`Unsupported type: ${type}`)
    }
}
function makeBodyTransformStringFromInputType(inputObjectType: InputObjectType): string {
    const transformedFields = inputObjectType.fields.map(
        (field) => `"${field.name}": {{$body.input.params.${field.name}}}`
    )
    return `{ ${transformedFields.join(", ")} }`
}
