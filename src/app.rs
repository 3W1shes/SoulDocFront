use crate::routes::Route;
use crate::state::{AuthState, CreateDocTrigger};
use dioxus::prelude::*;

const GLOBAL_CSS: &str = include_str!("../assets/style.css");

#[component]
pub fn App() -> Element {
    let mut auth = use_context_provider(|| Signal::new(AuthState::init()));
    use_context_provider(|| Signal::new(CreateDocTrigger(false)));

    use_effect(move || {
        if auth.read().token.is_some() && auth.read().user.is_none() {
            spawn(async move {
                match crate::api::auth::me().await {
                    Ok(user) => auth.write().user = Some(user),
                    Err(e) => {
                        // 只有 token 真正失效（401/403）才退出登录；
                        // 后端未启动或网络异常时保留 token，让用户继续操作
                        if e.contains("401") || e.contains("403") {
                            auth.write().logout();
                        }
                    }
                }
            });
        }
    });

    rsx! {
        style { "{GLOBAL_CSS}" }
        Router::<Route> {}
    }
}
