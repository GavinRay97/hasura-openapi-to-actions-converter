# Hasura OpenAPI -> Action Generator via Action Transforms

- [Hasura OpenAPI -> Action Generator via Action Transforms](#hasura-openapi---action-generator-via-action-transforms)
  - [Introduction](#introduction)
  - [Example](#example)
  - [Limitations](#limitations)

## Introduction

This repo contains a working implementation of a basic OpenAPI-Spec-to-Hasura-Action generator.

It uses the newly-released "Action Transforms" feature to generate mappings from the GraphQL object fields to the corresponding OpenAPI request fields.
- https://hasura.io/docs/latest/graphql/core/actions/transforms.html
  
## Example

Take the following basic FastAPI server, which exposes a `/login` endpoint:

```py
from dataclasses import dataclass
from fastapi import FastAPI

@dataclass
class AuthInput:
    email: str
    password: str

@dataclass
class AuthToken:
    token: str

app = FastAPI()

@app.post("/login", response_model=AuthToken)
async def login(input: AuthInput):
    return {"token": "<fake JWT token>"}
```

The OpenAPI definition generated for this is (as YAML to save space):

```yaml
---
openapi: 3.0.2
paths:
  "/login":
    post:
      summary: Login
      operationId: login_login_post
      requestBody:
        content:
          application/json:
            schema:
              "$ref": "#/components/schemas/AuthInput"
        required: true
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                "$ref": "#/components/schemas/AuthToken"
components:
  schemas:
    AuthInput:
      title: AuthInput
      required:
      - email
      - password
      type: object
      properties:
        email:
          title: Email
          type: string
        password:
          title: Password
          type: string
    AuthToken:
      title: AuthToken
      required:
      - token
      type: object
      properties:
        token:
          title: Token
          type: string
```

This tool generates the following Hasura metadata definition, which create the proper GraphQL input/output types to match the OpenAPI spec, as well as the Kriti lang `request_transform` which maps the values from the payload automatically:

```js
{
  actions: [
    {
      name: 'login',
      definition: {
        handler: 'http://localhost:8000/api/login',
        output_type: 'AuthToken!',
        arguments: [ { name: 'params', type: 'AuthInput!' } ],
        request_transform: {
          body: '{ "email": {{$body.input.params.email}}, "password": {{$body.input.params.password}} }',
          content_type: 'application/json',
          template_engine: 'Kriti'
        },
        type: 'mutation',
        kind: 'synchronous'
      }
    }
  ],
  custom_types: {
    objects: [
      {
        name: 'AuthToken',
        fields: [ { name: 'token', type: 'String!' } ]
      }
    ],
    input_objects: [
      {
        name: 'AuthInput',
        fields: [
          { name: 'email', type: 'String!' },
          { name: 'password', type: 'String!' }
        ]
      }
    ]
  }
}
```

## Limitations

Currently, it only supports requests which take payloads entirely from a body object (`requestBody`)

It is not possible to support URL params until Hasura gets the ability to template values into a request URL in addition to a request body.
See this issue for details:

https://github.com/hasura/graphql-engine/issues/8147

There are likely many edgecases and broken scenarios as well. Array values aren't yet supported, and this doesn't generate enum types yet either.

This was just me being curious how much effort it would take to get something like this working.
It turns out the answer was ~2 hours.

