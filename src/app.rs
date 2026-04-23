use crate::routes::Route;
use crate::state::AuthState;
use dioxus::prelude::*;

const GLOBAL_CSS: &str = include_str!("../assets/style.css");

#[component]
pub fn App() -> Element {
    let mut auth = use_context_provider(|| Signal::new(AuthState::init()));

    use_effect(move || {
        if auth.read().token.is_some() && auth.read().user.is_none() {
            spawn(async move {
                match crate::api::auth::me().await {
                    Ok(user) => auth.write().user = Some(user),
                    Err(_) => auth.write().logout(),
                }
            });
        }
    });

    rsx! {
        style { "{GLOBAL_CSS}" }
        style {
            r#"
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            "#
        }
        Router::<Route> {}
    }
}
