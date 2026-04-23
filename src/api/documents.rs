use super::{api_delete, api_get, api_post, api_put};
use crate::models::{Document, DocumentTreeNode};
use serde::{ser::SerializeStruct, Deserialize, Serialize, Serializer};

#[derive(Deserialize)]
struct SuccessData<T> {
    data: T,
}

#[derive(Deserialize)]
pub struct DocumentListData {
    pub documents: Option<Vec<Document>>,
    pub items: Option<Vec<Document>>,
    pub total: Option<u64>,
}

pub async fn list_documents(
    space_slug: &str,
    page: u32,
    page_size: u32,
) -> Result<DocumentListData, String> {
    let path = format!(
        "/api/docs/documents/{}?page={}&limit={}",
        space_slug, page, page_size
    );
    let resp: SuccessData<DocumentListData> = api_get(&path).await?;
    Ok(normalize_document_list(resp.data))
}

pub async fn get_document_tree(space_slug: &str) -> Result<Vec<DocumentTreeNode>, String> {
    let path = format!("/api/docs/documents/{}/tree", space_slug);
    let resp: SuccessData<Vec<DocumentTreeNode>> = api_get(&path).await?;
    Ok(resp.data)
}

#[derive(Serialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub slug: String,
    pub content: Option<String>,
    pub parent_id: Option<String>,
    pub status: Option<String>,
}

pub async fn create_document(
    space_slug: &str,
    req: CreateDocumentRequest,
) -> Result<Document, String> {
    let path = format!("/api/docs/documents/{}", space_slug);
    let resp: SuccessData<Document> = api_post(&path, &req).await?;
    Ok(normalize_document(resp.data))
}

pub async fn get_document(space_slug: &str, doc_slug: &str) -> Result<Document, String> {
    let path = format!("/api/docs/documents/{}/{}", space_slug, doc_slug);
    let resp: SuccessData<Document> = api_get(&path).await?;
    Ok(normalize_document(resp.data))
}

pub struct UpdateDocumentRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub status: Option<String>,
    pub tags: Option<Vec<String>>,
}

impl Serialize for UpdateDocumentRequest {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut field_count = 0;
        if self.title.is_some() {
            field_count += 1;
        }
        if self.content.is_some() {
            field_count += 1;
        }
        if self.status.is_some() {
            field_count += 2;
        }
        if self.tags.is_some() {
            field_count += 1;
        }

        let mut state = serializer.serialize_struct("UpdateDocumentRequest", field_count)?;
        if let Some(title) = &self.title {
            state.serialize_field("title", title)?;
        }
        if let Some(content) = &self.content {
            state.serialize_field("content", content)?;
        }
        if let Some(status) = &self.status {
            let is_public = status == "published";
            state.serialize_field("is_public", &is_public)?;
            state.serialize_field("status", status)?;
        }
        if let Some(tags) = &self.tags {
            state.serialize_field("metadata", &serde_json::json!({ "tags": tags }))?;
        }
        state.end()
    }
}

pub async fn update_document(
    space_slug: &str,
    doc_slug: &str,
    req: UpdateDocumentRequest,
) -> Result<Document, String> {
    let path = format!("/api/docs/documents/{}/{}", space_slug, doc_slug);
    let resp: SuccessData<Document> = api_put(&path, &req).await?;
    Ok(normalize_document(resp.data))
}

pub async fn delete_document(space_slug: &str, doc_slug: &str) -> Result<(), String> {
    let path = format!("/api/docs/documents/{}/{}", space_slug, doc_slug);
    api_delete(&path).await
}

fn normalize_document_list(mut data: DocumentListData) -> DocumentListData {
    if let Some(documents) = data.documents.take() {
        data.documents = Some(documents.into_iter().map(normalize_document).collect());
    }
    if let Some(items) = data.items.take() {
        data.items = Some(items.into_iter().map(normalize_document).collect());
    }
    data
}

fn normalize_document(mut doc: Document) -> Document {
    if doc.status.is_none() {
        doc.status = Some(if doc.is_public.unwrap_or(false) {
            "published".to_string()
        } else {
            "draft".to_string()
        });
    }
    if doc.tags.is_none() {
        if let Some(metadata) = &doc.metadata {
            doc.tags = Some(metadata.tags.clone());
        }
    }
    doc
}
