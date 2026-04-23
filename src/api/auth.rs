use super::{api_get, api_post, api_put};
use crate::models::User;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct RegisterRequest {
    email: String,
    password: String,
    username: Option<String>,
}

#[derive(Serialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Serialize)]
struct ChangePasswordRequest {
    old_password: String,
    new_password: String,
}

#[derive(Deserialize)]
struct AuthSuccess {
    data: LoginData,
}

#[derive(Deserialize)]
struct LoginData {
    token: String,
    user: UserData,
}

#[derive(Deserialize)]
struct UserData {
    id: String,
    email: String,
    username: Option<String>,
    avatar_url: Option<String>,
}

#[derive(Deserialize)]
struct MeSuccess {
    data: MeData,
}

#[derive(Deserialize)]
struct MeData {
    id: String,
    email: String,
    username: Option<String>,
    avatar_url: Option<String>,
}

pub struct LoginResult {
    pub token: String,
    pub user: User,
}

pub async fn login(email: String, password: String) -> Result<LoginResult, String> {
    let resp: AuthSuccess = api_post("/api/auth/login", &LoginRequest { email, password }).await?;
    Ok(LoginResult {
        token: resp.data.token,
        user: User {
            id: resp.data.user.id,
            email: resp.data.user.email,
            username: resp.data.user.username,
            avatar_url: resp.data.user.avatar_url,
            display_name: None,
        },
    })
}

pub async fn register(
    email: String,
    password: String,
    username: Option<String>,
) -> Result<(), String> {
    let _: Value = api_post(
        "/api/auth/register",
        &RegisterRequest {
            email,
            password,
            username,
        },
    )
    .await?;
    Ok(())
}

pub async fn me() -> Result<User, String> {
    let resp: MeSuccess = api_get("/api/auth/me").await?;
    Ok(User {
        id: resp.data.id,
        email: resp.data.email,
        username: resp.data.username,
        avatar_url: resp.data.avatar_url,
        display_name: None,
    })
}

pub async fn update_profile(req: UpdateProfileRequest) -> Result<(), String> {
    let _: Value = api_put("/api/auth/profile", &req).await?;
    Ok(())
}

pub async fn change_password(old_password: String, new_password: String) -> Result<(), String> {
    let _: Value = api_post(
        "/api/auth/change-password",
        &ChangePasswordRequest {
            old_password,
            new_password,
        },
    )
    .await?;
    Ok(())
}
