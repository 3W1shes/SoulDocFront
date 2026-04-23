#![allow(non_snake_case)]

mod api;
mod app;
mod components;
mod models;
mod pages;
mod routes;
mod state;

fn main() {
    dioxus::launch(app::App);
}
