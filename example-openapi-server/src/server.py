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
