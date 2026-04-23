use crate::api::files as files_api;
use crate::api::spaces as spaces_api;
use dioxus::prelude::*;

#[component]
pub fn Files() -> Element {
    let spaces_res = use_resource(|| async move { spaces_api::list_spaces(1, 50).await });
    let mut selected_id = use_signal(|| String::new());
    let mut selected_name = use_signal(|| String::new());
    let mut refresh = use_signal(|| 0u32);
    let mut uploading = use_signal(|| false);
    let mut upload_msg = use_signal(|| String::new());

    use_effect(move || {
        if selected_id.read().is_empty() {
            if let Some(Ok(data)) = &*spaces_res.read() {
                if let Some(first) = data
                    .spaces
                    .as_ref()
                    .or(data.items.as_ref())
                    .and_then(|s| s.first())
                {
                    selected_id.set(first.id.clone().unwrap_or_else(|| first.slug.clone()));
                    selected_name.set(first.name.clone());
                }
            }
        }
    });

    let files_res = use_resource(move || {
        let id = selected_id.read().clone();
        let _r = *refresh.read();
        async move {
            if id.is_empty() {
                return Ok(vec![]);
            }
            files_api::list_files(&id).await
        }
    });

    let mut deleting = use_signal(|| String::new());

    let do_upload = move |_| {
        let space_id = selected_id.read().clone();
        if space_id.is_empty() {
            return;
        }
        let token = crate::api::get_token().unwrap_or_default();
        uploading.set(true);
        upload_msg.set(String::new());
        let js = format!(
            r#"(function(){{
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.multiple = true;
  inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = async function() {{
    var files = inp.files;
    if (!files || !files.length) {{ dioxus.send('cancel'); document.body.removeChild(inp); return; }}
    var ok = 0, fail = 0;
    for (var i = 0; i < files.length; i++) {{
      var form = new FormData();
      form.append('file', files[i]);
      form.append('space_id', '{space_id}');
      try {{
        var r = await fetch('http://localhost:3001/api/docs/files', {{
          method: 'POST',
          headers: {{'Authorization': 'Bearer {token}'}},
          body: form
        }});
        if (r.ok) ok++; else fail++;
      }} catch(e) {{ fail++; }}
    }}
    document.body.removeChild(inp);
    dioxus.send('done:'+ok+':'+fail);
  }};
  inp.addEventListener('cancel', function() {{ dioxus.send('cancel'); document.body.removeChild(inp); }});
  inp.click();
}})();"#
        );
        spawn(async move {
            let mut eval = document::eval(&js);
            match eval.recv::<String>().await {
                Ok(msg) if msg.starts_with("done:") => {
                    let parts: Vec<&str> = msg.splitn(3, ':').collect();
                    let ok = parts.get(1).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
                    let fail = parts.get(2).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
                    upload_msg.set(if fail == 0 {
                        format!("✅ 成功上传 {} 个文件", ok)
                    } else {
                        format!("上传完成：{} 成功，{} 失败", ok, fail)
                    });
                    let cur = *refresh.read();
                    refresh.set(cur + 1);
                }
                _ => {}
            }
            uploading.set(false);
        });
    };

    rsx! {
        document::Title { "文件管理 — SoulDoc" }
        div { class: "page-content",
            div { class: "page-header",
                div { class: "page-header-left",
                    h1 { "📁 文件管理" }
                    p { "管理空间内的文件资产：图片、附件、导出产物" }
                }
                div { class: "page-header-actions",
                    if !upload_msg().is_empty() {
                        span { style: "font-size:12.5px;color:var(--muted);margin-right:8px;", "{upload_msg}" }
                    }
                    if !selected_id.read().is_empty() {
                        button {
                            class: "btn btn-primary",
                            disabled: uploading(),
                            onclick: do_upload,
                            if uploading() { "⬆ 上传中…" } else { "⬆ 上传文件" }
                        }
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
                        let spaces = data
                            .spaces
                            .as_ref()
                            .or(data.items.as_ref())
                            .cloned()
                            .unwrap_or_default();
                        rsx! {
                            div { style: "display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;",
                                for space in spaces.iter() {
                                    {
                                        let id = space.id.clone().unwrap_or_else(|| space.slug.clone());
                                        let name = space.name.clone();
                                        let is_sel = *selected_id.read() == id;
                                        rsx! {
                                            button {
                                                class: if is_sel { "btn btn-primary btn-sm" } else { "btn btn-sm" },
                                                onclick: move |_| {
                                                    selected_id.set(id.clone());
                                                    selected_name.set(name.clone());
                                                    upload_msg.set(String::new());
                                                },
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

            // Drop zone hint
            if !selected_id.read().is_empty() {
                div {
                    style: "border:2px dashed var(--line);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;cursor:pointer;transition:border-color .2s;",
                    onclick: do_upload,
                    onmouseenter: move |_| {},
                    div { style: "font-size:32px;margin-bottom:8px;", "☁️" }
                    p { style: "font-size:14px;font-weight:600;color:var(--text2);margin-bottom:4px;", "点击选择文件上传" }
                    p { style: "font-size:12px;color:var(--muted);", "支持图片、PDF、文档等所有文件类型，可多选" }
                }
            }

            // File list
            if !selected_id.read().is_empty() {
                match &*files_res.read() {
                    None => rsx! {
                        div { class: "text-muted", style: "padding:40px;text-align:center;", "加载中…" }
                    },
                    Some(Err(e)) => rsx! {
                        div { style: "color:#dc2626;padding:40px;text-align:center;", "加载失败：{e}" }
                    },
                    Some(Ok(files)) => {
                        if files.is_empty() {
                            rsx! {
                                div { style: "text-align:center;padding:40px;color:var(--muted);",
                                    p { style: "font-size:13px;", "该空间还没有文件，点击上方区域上传" }
                                }
                            }
                        } else {
                            let images: Vec<_> =
                                files.iter().filter(|f| f.file_type == "image").collect();
                            let others: Vec<_> =
                                files.iter().filter(|f| f.file_type != "image").collect();
                            rsx! {
                                // Stats row
                                div { style: "display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;",
                                    div { class: "metric-card", style: "flex:1;min-width:120px;",
                                        div { class: "metric-value", "{files.len()}" }
                                        div { class: "metric-label", "文件总数" }
                                    }
                                    div { class: "metric-card", style: "flex:1;min-width:120px;",
                                        div { class: "metric-value", "{images.len()}" }
                                        div { class: "metric-label", "图片" }
                                    }
                                    div { class: "metric-card", style: "flex:1;min-width:120px;",
                                        div { class: "metric-value",
                                            {
                                                let total: i64 = files.iter().map(|f| f.file_size).sum();
                                                format_size(total)
                                            }
                                        }
                                        div { class: "metric-label", "总大小" }
                                    }
                                }

                                // Images
                                if !images.is_empty() {
                                    div { class: "card", style: "margin-bottom:20px;",
                                        div { class: "card-header",
                                            h3 { "🖼️ 图片 ({images.len()})" }
                                        }
                                        div { class: "file-grid",
                                            for f in images.iter() {
                                                {
                                                    let fid = f.id.clone();
                                                    let furl = f.url.clone();
                                                    let fname = f.original_name.clone();
                                                    let fsize = f.file_size;
                                                    rsx! {
                                                        div { class: "file-card",
                                                            div { class: "file-card-preview",
                                                                img {
                                                                    src: "{furl}",
                                                                    style: "width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:8px;"
                                                                }
                                                            }
                                                            div { class: "file-card-name", title: "{fname}", "{fname}" }
                                                            div { class: "file-card-size", "{format_size(fsize)}" }
                                                            div { style: "display:flex;gap:4px;margin-top:8px;",
                                                                a {
                                                                    class: "btn btn-sm",
                                                                    href: "{furl}",
                                                                    target: "_blank",
                                                                    "下载"
                                                                }
                                                                button {
                                                                    class: "btn btn-sm",
                                                                    style: "color:#dc2626;",
                                                                    disabled: *deleting.read() == fid,
                                                                    onclick: move |_| {
                                                                        let fid2 = fid.clone();
                                                                        deleting.set(fid2.clone());
                                                                        spawn(async move {
                                                                            let _ = files_api::delete_file(&fid2).await;
                                                                            deleting.set(String::new());
                                                                            let cur = *refresh.read();
                                                                            refresh.set(cur + 1);
                                                                        });
                                                                    },
                                                                    if *deleting.read() == fid { "删除中…" } else { "删除" }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // Other files
                                if !others.is_empty() {
                                    div { class: "card",
                                        div { class: "card-header",
                                            h3 { "📎 附件 ({others.len()})" }
                                        }
                                        div { style: "display:flex;flex-direction:column;gap:8px;",
                                            for f in others.iter() {
                                                {
                                                    let fid = f.id.clone();
                                                    let furl = f.url.clone();
                                                    let fname = f.original_name.clone();
                                                    let ftype = f.file_type.clone();
                                                    let fsize = f.file_size;
                                                    let fdate = f.created_at.clone();
                                                    rsx! {
                                                        div { style: "display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);",
                                                            span { style: "font-size:24px;flex-shrink:0;", "{file_icon(&ftype)}" }
                                                            div { style: "flex:1;min-width:0;",
                                                                p { style: "font-size:13.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;", "{fname}" }
                                                                p { style: "font-size:12px;color:var(--muted);", "{format_size(fsize)} · {fdate}" }
                                                            }
                                                            div { style: "display:flex;gap:6px;flex-shrink:0;",
                                                                a {
                                                                    class: "btn btn-sm",
                                                                    href: "{furl}",
                                                                    target: "_blank",
                                                                    "下载"
                                                                }
                                                                button {
                                                                    class: "btn btn-sm btn-danger",
                                                                    disabled: *deleting.read() == fid,
                                                                    onclick: move |_| {
                                                                        let fid2 = fid.clone();
                                                                        deleting.set(fid2.clone());
                                                                        spawn(async move {
                                                                            let _ = files_api::delete_file(&fid2).await;
                                                                            deleting.set(String::new());
                                                                            let cur = *refresh.read();
                                                                            refresh.set(cur + 1);
                                                                        });
                                                                    },
                                                                    if *deleting.read() == fid { "删除中…" } else { "删除" }
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
        }
    }
}

fn format_size(bytes: i64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    }
}

fn file_icon(file_type: &str) -> &'static str {
    match file_type {
        "pdf" => "📄",
        "video" => "🎬",
        "audio" => "🎵",
        "archive" => "📦",
        "spreadsheet" => "📊",
        "doc" | "docx" => "📝",
        _ => "📎",
    }
}
