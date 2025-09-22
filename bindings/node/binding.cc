#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_asciidoc();

// "tree-sitter", "language" hashed with BLAKE2 (expected by tree-sitter runtime)
const napi_type_tag LANGUAGE_TYPE_TAG = { 0x8AF2E5212AD58ABF, 0xD5006CAD83ABBA16 };

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    auto language = Napi::External<TSLanguage>::New(env, tree_sitter_asciidoc());
    language.TypeTag(&LANGUAGE_TYPE_TAG);
    exports["language"] = language;
    exports["name"] = Napi::String::New(env, "asciidoc");
    return exports;
}

NODE_API_MODULE(tree_sitter_asciidoc_binding, Init);
