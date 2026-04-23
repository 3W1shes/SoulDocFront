use crate::api::members as members_api;
use crate::api::spaces as spaces_api;
use dioxus::prelude::*;

#[component]
pub fn Members() -> Element {
    let spaces_res = use_resource(|| async move { spaces_api::list_spaces(1, 50).await });
    let mut selected_slug = use_signal(|| String::new());

    use_effect(move || {
        if selected_slug.read().is_empty() {
            if let Some(Ok(data)) = &*spaces_res.read() {
                if let Some(first) = data.spaces.as_ref().or(data.items.as_ref()).and_then(|s| s.first()) {
                    selected_slug.set(first.slug.clone());
                }
            }
        }
    });

    let members_res = use_resource(move || {
        let slug = selected_slug.read().clone();
        async move {
            if slug.is_empty() {
                return Err("请选择空间".to_string());
            }
            members_api::list_members(&slug).await
        }
    });

    let mut invite_email = use_signal(|| String::new());
    let mut invite_role = use_signal(|| "viewer".to_string());
    let mut invite_err = use_signal(|| String::new());
    let mut inviting = use_signal(|| false);
    let mut show_invite = use_signal(|| false);

    let do_invite = move |_| {
        let slug = selected_slug.read().clone();
        let email = invite_email.read().trim().to_string();
        if slug.is_empty() || email.is_empty() {
            return;
        }
        inviting.set(true);
        invite_err.set(String::new());
        spawn(async move {
            match members_api::invite_member(
                &slug,
                members_api::InviteRequest {
                    email: Some(email),
                    role: invite_role.read().clone(),
                    message: None,
                },
            )
            .await
            {
                Ok(_) => {
                    show_invite.set(false);
                    invite_email.set(String::new());
                }
                Err(e) => invite_err.set(e),
            }
            inviting.set(false);
        });
    };

    rsx! {
        document::Title { "成员权限 — SoulDoc" }
        div { class: "page-content",
            div { class: "page-header",
                div { class: "page-header-left",
                    h1 { "👥 成员权限" }
                    p { "管理知识空间的成员与角色" }
                }
                div { class: "page-header-actions",
                    if !selected_slug.read().is_empty() {
                        button { class: "btn btn-primary", onclick: move |_| show_invite.set(true), "邀请成员" }
                    }
                }
            }

            // Space selector
            div { class: "card", style: "margin-bottom:20px;",
                div { class: "card-header", h3 { "选择空间" } }
                match &*spaces_res.read() {
                    None => rsx! { p { class: "text-muted", style: "padding:12px;", "加载中…" } },
                    Some(Err(e)) => rsx! { p { style: "color:#dc2626;padding:12px;", "{e}" } },
                    Some(Ok(data)) => {
                        let spaces = data.spaces.as_ref().or(data.items.as_ref()).cloned().unwrap_or_default();
                        rsx! {
                            div { style: "display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;",
                                for space in spaces.iter() {
                                    {
                                        let slug = space.slug.clone();
                                        let name = space.name.clone();
                                        let is_sel = *selected_slug.read() == slug;
                                        rsx! {
                                            button {
                                                class: if is_sel { "btn btn-primary btn-sm" } else { "btn btn-sm" },
                                                onclick: move |_| selected_slug.set(slug.clone()),
                                                "{name}"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Invite modal
            if show_invite() {
                div { style: "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:center;justify-content:center;",
                    onclick: move |_| show_invite.set(false),
                    div { class: "card", style: "width:400px;padding:24px;", onclick: move |e| e.stop_propagation(),
                        h3 { style: "font-size:15px;font-weight:700;margin-bottom:16px;", "邀请成员" }
                        div { class: "form-group",
                            label { class: "form-label", "邮箱地址" }
                            input { class: "input", r#type: "email", placeholder: "user@example.com",
                                value: "{invite_email}", oninput: move |e| invite_email.set(e.value()) }
                        }
                        div { class: "form-group",
                            label { class: "form-label", "角色" }
                            select { class: "input", value: "{invite_role}",
                                onchange: move |e| invite_role.set(e.value()),
                                option { value: "viewer", "Viewer — 只读" }
                                option { value: "member", "Member — 普通成员" }
                                option { value: "editor", "Editor — 编辑者" }
                                option { value: "admin", "Admin — 管理员" }
                            }
                        }
                        if !invite_err().is_empty() {
                            p { style: "color:#dc2626;font-size:13px;margin-bottom:10px;", "{invite_err}" }
                        }
                        div { style: "display:flex;gap:10px;justify-content:flex-end;",
                            button { class: "btn", onclick: move |_| show_invite.set(false), "取消" }
                            button { class: "btn btn-primary", disabled: inviting(), onclick: do_invite,
                                if inviting() { "发送中…" } else { "发送邀请" }
                            }
                        }
                    }
                }
            }

            // Members list
            if !selected_slug.read().is_empty() {
                div { class: "card",
                    div { class: "card-header",
                        h3 { "成员列表 — {selected_slug}" }
                    }
                    match &*members_res.read() {
                        None => rsx! { p { class: "text-muted", style: "padding:16px;", "加载中…" } },
                        Some(Err(e)) => rsx! { p { style: "color:#dc2626;padding:16px;", "加载失败：{e}" } },
                        Some(Ok(members)) => {
                            if members.is_empty() {
                                rsx! {
                                    div { style: "padding:40px;text-align:center;color:var(--muted);",
                                        div { style: "font-size:36px;margin-bottom:10px;", "👥" }
                                        p { "该空间还没有成员" }
                                    }
                                }
                            } else {
                                rsx! {
                                    table { style: "width:100%;border-collapse:collapse;",
                                        thead {
                                            tr { style: "border-bottom:1px solid var(--line);",
                                                th { style: "text-align:left;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "成员" }
                                                th { style: "text-align:left;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "角色" }
                                                th { style: "text-align:left;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "状态" }
                                                th { style: "text-align:left;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "加入时间" }
                                            }
                                        }
                                        tbody {
                                            for m in members.iter() {
                                                tr { style: "border-bottom:1px solid var(--line);",
                                                    td { style: "padding:12px 16px;",
                                                        div { style: "display:flex;align-items:center;gap:8px;",
                                                            div { class: "avatar", style: "width:28px;height:28px;font-size:11px;",
                                                                "{m.username.as_deref().or(m.email.as_deref()).unwrap_or(\"?\").chars().next().unwrap_or('?').to_uppercase().to_string()}"
                                                            }
                                                            div {
                                                                p { style: "font-size:13.5px;font-weight:500;", "{m.username.as_deref().unwrap_or(\"-\")}" }
                                                                p { style: "font-size:12px;color:var(--muted);", "{m.email.as_deref().unwrap_or(\"-\")}" }
                                                            }
                                                        }
                                                    }
                                                    td { style: "padding:12px 16px;",
                                                        span { class: "badge badge-primary", "{m.role.as_deref().unwrap_or(\"-\")}" }
                                                    }
                                                    td { style: "padding:12px 16px;",
                                                        span { class: "badge badge-success", "{m.status.as_deref().unwrap_or(\"active\")}" }
                                                    }
                                                    td { style: "padding:12px 16px;font-size:12px;color:var(--muted);",
                                                        "{m.joined_at.as_deref().unwrap_or(\"-\")}"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
