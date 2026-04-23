use crate::api::documents as docs_api;
use crate::api::spaces as spaces_api;
use crate::models::DocumentTreeNode;
use crate::routes::Route;
use dioxus::prelude::*;
use gloo_storage::{LocalStorage, Storage};

#[component]
pub fn Docs() -> Element {
    let spaces_res = use_resource(|| async move { spaces_api::list_spaces(1, 50).await });
    let mut selected_space = use_signal(|| String::new());
    let mut active_doc_slug = use_signal(|| String::new());

    use_effect(move || {
        if selected_space.read().is_empty() {
            if let Some(Ok(data)) = &*spaces_res.read() {
                if let Some(first) = data.spaces.as_ref().or(data.items.as_ref()).and_then(|s| s.first()) {
                    selected_space.set(first.slug.clone());
                }
            }
        }
    });

    let tree_res = use_resource(move || {
        let slug = selected_space.read().clone();
        async move {
            if slug.is_empty() {
                return Ok(vec![]);
            }
            docs_api::get_document_tree(&slug).await
        }
    });

    let doc_res = use_resource(move || {
        let space = selected_space.read().clone();
        let doc = active_doc_slug.read().clone();
        async move {
            if space.is_empty() || doc.is_empty() {
                return Ok(None);
            }
            docs_api::get_document(&space, &doc).await.map(Some)
        }
    });

    let mut show_create = use_signal(|| false);
    let mut new_title = use_signal(|| String::new());
    let mut new_slug = use_signal(|| String::new());
    let mut creating = use_signal(|| false);
    let mut create_err = use_signal(|| String::new());
    let navigator = use_navigator();

    let do_create = move |_| {
        let space = selected_space.read().clone();
        let title = new_title.read().trim().to_string();
        let slug = new_slug.read().trim().to_string();
        if space.is_empty() || title.is_empty() || slug.is_empty() {
            return;
        }
        creating.set(true);
        create_err.set(String::new());
        spawn(async move {
            match docs_api::create_document(
                &space,
                docs_api::CreateDocumentRequest {
                    title,
                    slug: slug.clone(),
                    content: None,
                    parent_id: None,
                    status: Some("draft".to_string()),
                },
            )
            .await
            {
                Ok(_) => {
                    let _ = LocalStorage::set("editor_space", space.clone());
                    let _ = LocalStorage::set("editor_doc", slug.clone());
                    show_create.set(false);
                    navigator.replace(Route::Editor {});
                }
                Err(e) => create_err.set(e),
            }
            creating.set(false);
        });
    };

    rsx! {
        document::Title { "文档中心 — SoulDoc" }

        // Create doc modal
        if show_create() {
            div { style: "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;display:flex;align-items:center;justify-content:center;",
                onclick: move |_| show_create.set(false),
                div { class: "card", style: "width:420px;padding:24px;", onclick: move |e| e.stop_propagation(),
                    h3 { style: "font-size:15px;font-weight:700;margin-bottom:16px;", "新建文档" }
                    div { class: "form-group",
                        label { class: "form-label", "文档标题" }
                        input { class: "input", placeholder: "输入文档标题", value: "{new_title}",
                            oninput: move |e| new_title.set(e.value()) }
                    }
                    div { class: "form-group",
                        label { class: "form-label", "Slug" }
                        input { class: "input", placeholder: "document-slug", value: "{new_slug}",
                            oninput: move |e| new_slug.set(e.value()) }
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

        div { class: "docs-layout",
            // Doc tree panel
            div { class: "doc-tree-panel",
                div { class: "doc-tree-top",
                    match &*spaces_res.read() {
                        None => rsx! { p { style: "padding:8px;font-size:12px;color:var(--muted);", "加载中…" } },
                        Some(Err(_)) => rsx! { p { style: "padding:8px;font-size:12px;color:#dc2626;", "加载失败" } },
                        Some(Ok(data)) => {
                            let spaces = data.spaces.as_ref().or(data.items.as_ref()).cloned().unwrap_or_default();
                            rsx! {
                                select {
                                    class: "input",
                                    style: "font-size:13px;padding:8px 10px;",
                                    value: "{selected_space}",
                                    onchange: move |e| {
                                        selected_space.set(e.value());
                                        active_doc_slug.set(String::new());
                                    },
                                    option { value: "", "— 选择空间 —" }
                                    for s in spaces.iter() {
                                        option { value: "{s.slug}", selected: s.slug == *selected_space.read(), "{s.name}" }
                                    }
                                }
                            }
                        }
                    }
                }
                div { style: "padding:8px 4px;flex:1;overflow-y:auto;",
                    match &*tree_res.read() {
                        None => rsx! { p { style: "padding:12px;font-size:13px;color:var(--muted);", "加载中…" } },
                        Some(Err(e)) => rsx! { p { style: "padding:12px;font-size:13px;color:#dc2626;", "加载失败：{e}" } },
                        Some(Ok(nodes)) if nodes.is_empty() => rsx! {
                            if selected_space.read().is_empty() {
                                p { style: "padding:12px;font-size:13px;color:var(--muted);", "请先选择空间" }
                            } else {
                                div { style: "padding:16px 12px;text-align:center;color:var(--muted);",
                                    div { style: "font-size:28px;margin-bottom:8px;", "📄" }
                                    p { style: "font-size:13px;", "暂无文档" }
                                }
                            }
                        },
                        Some(Ok(nodes)) => rsx! {
                            for node in nodes.iter() {
                                TreeNodeEl { node: node.clone(), active: active_doc_slug(), onclick: move |slug: String| active_doc_slug.set(slug) }
                            }
                        },
                    }
                    div { style: "padding:12px 10px;",
                        button {
                            class: "btn btn-sm w-full",
                            style: "justify-content:center;",
                            disabled: selected_space.read().is_empty(),
                            onclick: move |_| show_create.set(true),
                            "＋ 新建文档"
                        }
                    }
                }
            }

            // Doc content panel
            div { class: "doc-center-panel",
                match &*doc_res.read() {
                    None => rsx! {
                        div { style: "display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);",
                            p { "加载中…" }
                        }
                    },
                    Some(Err(e)) => rsx! {
                        div { style: "display:flex;align-items:center;justify-content:center;height:100%;color:#dc2626;",
                            p { "加载失败：{e}" }
                        }
                    },
                    Some(Ok(None)) => rsx! {
                        div { style: "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted);",
                            div { style: "font-size:64px;margin-bottom:16px;", "📄" }
                            h3 { style: "font-size:16px;margin-bottom:8px;", "选择一篇文档" }
                            p { style: "font-size:13px;", "从左侧文档树中选择要查看的文档" }
                        }
                    },
                    Some(Ok(Some(doc))) => rsx! {
                        div { class: "doc-status-bar",
                            div { class: "breadcrumb",
                                Link { to: Route::Spaces {}, "空间" }
                                span { class: "breadcrumb-sep", "›" }
                                span { "{selected_space}" }
                                span { class: "breadcrumb-sep", "›" }
                                strong { style: "color:var(--text);", "{doc.title}" }
                            }
                            div { style: "margin-left:auto;display:flex;align-items:center;gap:8px;",
                                {
                                    let status = doc.status.as_deref().unwrap_or("draft");
                                    let (cls, label) = match status {
                                        "published" => ("badge badge-success", "已发布"),
                                        "review" => ("badge badge-warning", "审核中"),
                                        _ => ("badge badge-gray", "草稿"),
                                    };
                                    rsx! { span { class: cls, "{label}" } }
                                }
                                Link { to: Route::Editor {}, class: "btn btn-sm btn-primary", "编辑" }
                            }
                        }
                        div { class: "doc-content-body",
                            h1 { style: "font-size:28px;font-weight:800;letter-spacing:-.5px;margin-bottom:8px;",
                                "{doc.title}"
                            }
                            div { style: "display:flex;align-items:center;gap:12px;font-size:12.5px;color:var(--muted);margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--line);",
                                if let Some(updated_at) = &doc.updated_at {
                                    span { "🕐 {updated_at}" }
                                }
                                span { "🔗 {doc.slug}" }
                                if let Some(tags) = &doc.tags {
                                    if !tags.is_empty() {
                                        for tag in tags.iter() {
                                            span { class: "tag", style: "font-size:11px;", "{tag}" }
                                        }
                                    }
                                }
                            }
                            if let Some(content) = &doc.content {
                                if content.is_empty() {
                                    p { style: "color:var(--muted);font-size:14px;font-style:italic;", "该文档暂无内容，点击「编辑」开始写作" }
                                } else {
                                    div { style: "color:var(--text2);line-height:1.8;font-size:14.5px;white-space:pre-wrap;",
                                        "{content}"
                                    }
                                }
                            } else {
                                p { style: "color:var(--muted);font-size:14px;font-style:italic;", "该文档暂无内容，点击「编辑」开始写作" }
                            }
                        }
                    },
                }
            }

            // Doc meta panel
            div { class: "doc-meta-panel",
                match &*doc_res.read() {
                    Some(Ok(Some(doc))) => rsx! {
                        div { class: "doc-meta-section",
                            p { style: "font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);margin-bottom:10px;", "文档信息" }
                            div { style: "display:flex;flex-direction:column;gap:8px;font-size:13px;",
                                div { style: "display:flex;justify-content:space-between;",
                                    span { style: "color:var(--muted);", "状态" }
                                    {
                                        let status = doc.status.as_deref().unwrap_or("draft");
                                        let (cls, label) = match status {
                                            "published" => ("badge badge-success", "已发布"),
                                            "review" => ("badge badge-warning", "审核中"),
                                            _ => ("badge badge-gray", "草稿"),
                                        };
                                        rsx! { span { class: cls, "{label}" } }
                                    }
                                }
                                div { style: "display:flex;justify-content:space-between;",
                                    span { style: "color:var(--muted);", "Slug" }
                                    span { style: "font-weight:500;font-size:12px;", "{doc.slug}" }
                                }
                                if let Some(updated_at) = &doc.updated_at {
                                    div { style: "display:flex;justify-content:space-between;",
                                        span { style: "color:var(--muted);", "更新时间" }
                                        span { style: "font-weight:500;font-size:11px;", "{updated_at}" }
                                    }
                                }
                            }
                        }
                        if let Some(tags) = &doc.tags {
                            if !tags.is_empty() {
                                div { class: "doc-meta-section",
                                    p { style: "font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);margin-bottom:10px;", "标签" }
                                    div { style: "display:flex;flex-wrap:wrap;gap:6px;",
                                        for tag in tags.iter() {
                                            span { class: "tag", "{tag}" }
                                        }
                                    }
                                }
                            }
                        }
                        div { class: "doc-meta-section",
                            p { style: "font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);margin-bottom:10px;", "操作" }
                            div { style: "display:flex;flex-direction:column;gap:6px;",
                                Link { to: Route::Versions {}, class: "btn btn-sm", style: "justify-content:center;", "版本历史" }
                                Link { to: Route::ChangeRequests {}, class: "btn btn-sm", style: "justify-content:center;", "提交变更请求" }
                                Link { to: Route::Editor {}, class: "btn btn-sm btn-primary", style: "justify-content:center;", "编辑文档" }
                            }
                        }
                    },
                    _ => rsx! {
                        div { class: "doc-meta-section",
                            p { style: "font-size:12px;color:var(--muted);", "选择文档后显示信息" }
                        }
                    },
                }
            }
        }
    }
}

#[component]
fn TreeNodeEl(node: DocumentTreeNode, active: String, onclick: EventHandler<String>) -> Element {
    let slug = node.slug.clone();
    let title = node.title.clone();
    let is_active = active == slug;
    let status = node.status.as_deref().unwrap_or("draft");
    let badge = match status {
        "published" => "已发布",
        "review" => "审核中",
        _ => "",
    };

    rsx! {
        div {
            div {
                class: if is_active { "tree-node active" } else { "tree-node" },
                onclick: {
                    let slug = slug.clone();
                    move |_| onclick.call(slug.clone())
                },
                span { class: "tree-icon" }
                "📄 {title}"
                if !badge.is_empty() {
                    span { class: "tree-badge", "{badge}" }
                }
            }
            if let Some(children) = &node.children {
                div { style: "padding-left:16px;",
                    for child in children.iter() {
                        TreeNodeEl { node: child.clone(), active: active.clone(), onclick: onclick }
                    }
                }
            }
        }
    }
}
