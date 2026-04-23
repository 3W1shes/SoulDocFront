use crate::api::tags as tags_api;
use crate::models::Tag;
use dioxus::prelude::*;

#[component]
pub fn Tags() -> Element {
    let tags_res = use_resource(|| async move { tags_api::list_tags(None, 1, 100).await });

    let mut show_create = use_signal(|| false);
    let mut new_name = use_signal(|| String::new());
    let mut new_color = use_signal(|| "#6366f1".to_string());
    let mut new_desc = use_signal(|| String::new());
    let mut create_err = use_signal(|| String::new());
    let mut creating = use_signal(|| false);

    let do_create = move |_| {
        let name = new_name.read().trim().to_string();
        let color = new_color.read().clone();
        let desc = new_desc.read().trim().to_string();
        if name.is_empty() {
            return;
        }
        creating.set(true);
        create_err.set(String::new());
        spawn(async move {
            match tags_api::create_tag(tags_api::CreateTagRequest {
                name,
                color: Some(color),
                description: Some(desc),
                space_id: None,
            })
            .await
            {
                Ok(_) => {
                    show_create.set(false);
                    new_name.set(String::new());
                    new_desc.set(String::new());
                }
                Err(e) => create_err.set(e),
            }
            creating.set(false);
        });
    };

    rsx! {
        document::Title { "标签管理 — SoulDoc" }
        div { class: "page-content",
            div { class: "page-header",
                div { class: "page-header-left",
                    h1 { "🏷️ 标签管理" }
                    p { "为文档打标签，方便分类检索与过滤" }
                }
                div { class: "page-header-actions",
                    button { class: "btn btn-primary", onclick: move |_| show_create.set(true), "＋ 新建标签" }
                }
            }

            if show_create() {
                div { style: "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:center;justify-content:center;",
                    onclick: move |_| show_create.set(false),
                    div { class: "card", style: "width:400px;padding:24px;", onclick: move |e| e.stop_propagation(),
                        h3 { style: "font-size:15px;font-weight:700;margin-bottom:16px;", "新建标签" }
                        div { class: "form-group",
                            label { class: "form-label", "名称" }
                            input { class: "input", placeholder: "标签名称", value: "{new_name}",
                                oninput: move |e| new_name.set(e.value()) }
                        }
                        div { class: "form-group",
                            label { class: "form-label", "颜色" }
                            div { style: "display:flex;align-items:center;gap:10px;",
                                input { r#type: "color", value: "{new_color}",
                                    style: "width:40px;height:36px;border:none;cursor:pointer;border-radius:6px;",
                                    oninput: move |e| new_color.set(e.value()) }
                                input { class: "input", value: "{new_color}",
                                    oninput: move |e| new_color.set(e.value()) }
                            }
                        }
                        div { class: "form-group",
                            label { class: "form-label", "描述（可选）" }
                            input { class: "input", placeholder: "标签用途说明", value: "{new_desc}",
                                oninput: move |e| new_desc.set(e.value()) }
                        }
                        if !create_err().is_empty() {
                            p { style: "color:#dc2626;font-size:13px;margin-bottom:10px;", "{create_err}" }
                        }
                        div { style: "display:flex;gap:10px;justify-content:flex-end;",
                            button { class: "btn", onclick: move |_| show_create.set(false), "取消" }
                            button { class: "btn btn-primary", disabled: creating(), onclick: do_create,
                                if creating() { "创建中…" } else { "创建" }
                            }
                        }
                    }
                }
            }

            match &*tags_res.read() {
                None => rsx! { div { class: "text-muted", style: "padding:40px;text-align:center;", "加载中…" } },
                Some(Err(e)) => rsx! { div { style: "color:#dc2626;padding:40px;text-align:center;", "加载失败：{e}" } },
                Some(Ok(data)) => {
                    let tags = data.tags.as_ref().cloned().unwrap_or_default();
                    rsx! {
                        div { class: "card", style: "margin-bottom:20px;",
                            div { class: "card-header", h3 { "标签云（{tags.len()}）" } }
                            div { style: "display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;",
                                for tag in tags.iter() {
                                    {
                                        let color = tag.color.clone().unwrap_or_else(|| "#6366f1".into());
                                        let name = tag.name.clone();
                                        let cnt = tag.doc_count.unwrap_or(0);
                                        rsx! {
                                            span {
                                                style: "display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:500;background:{color}22;color:{color};border:1px solid {color}55;",
                                                span { style: "width:7px;height:7px;border-radius:50%;background:{color};display:inline-block;" }
                                                "{name}"
                                                span { style: "opacity:.65;font-size:11px;", "({cnt})" }
                                            }
                                        }
                                    }
                                }
                                if tags.is_empty() {
                                    p { style: "color:var(--muted);font-size:13px;", "还没有标签" }
                                }
                            }
                        }

                        div { class: "card",
                            div { class: "card-header", h3 { "标签列表" } }
                            if tags.is_empty() {
                                div { style: "padding:40px;text-align:center;color:var(--muted);",
                                    div { style: "font-size:36px;margin-bottom:10px;", "🏷️" }
                                    p { "还没有标签，点击「新建标签」创建第一个" }
                                }
                            } else {
                                table { style: "width:100%;border-collapse:collapse;",
                                    thead {
                                        tr { style: "border-bottom:1px solid var(--line);",
                                            th { style: "text-align:left;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "标签" }
                                            th { style: "text-align:left;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "描述" }
                                            th { style: "text-align:center;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "文档数" }
                                            th { style: "text-align:right;padding:10px 16px;font-size:12px;color:var(--muted);font-weight:600;", "操作" }
                                        }
                                    }
                                    tbody {
                                        for tag in tags.into_iter() {
                                            TagRow { tag }
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

#[component]
fn TagRow(tag: Tag) -> Element {
    let tag_id = tag.id.clone().unwrap_or_default();
    let color = tag.color.clone().unwrap_or_else(|| "#6366f1".into());
    let name = tag.name.clone();
    let desc = tag.description.clone().unwrap_or_default();
    let doc_count = tag.doc_count.unwrap_or(0);
    let mut deleting = use_signal(|| false);

    let do_delete = move |_| {
        let id = tag_id.clone();
        if id.is_empty() {
            return;
        }
        deleting.set(true);
        spawn(async move {
            let _ = tags_api::delete_tag(&id).await;
            deleting.set(false);
        });
    };

    rsx! {
        tr { style: "border-bottom:1px solid var(--line);",
            td { style: "padding:12px 16px;",
                div { style: "display:flex;align-items:center;gap:8px;",
                    span { style: "width:10px;height:10px;border-radius:50%;background:{color};display:inline-block;" }
                    span { style: "font-weight:500;font-size:13.5px;", "{name}" }
                }
            }
            td { style: "padding:12px 16px;font-size:13px;color:var(--muted);", "{desc}" }
            td { style: "padding:12px 16px;text-align:center;", span { class: "badge badge-gray", "{doc_count}" } }
            td { style: "padding:12px 16px;text-align:right;",
                button { class: "btn btn-sm", style: "color:#dc2626;", disabled: deleting(), onclick: do_delete,
                    if deleting() { "删除中…" } else { "删除" }
                }
            }
        }
    }
}
