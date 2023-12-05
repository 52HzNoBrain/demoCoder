/* eslint-disable */
import { workspace } from "vscode";
import { FetchStream } from "./FetchStream";
import { PromptDto } from "./ChatMemory"
import AbortController from "abort-controller";

let abortController = new AbortController();

export async function stopEventStream() {
    abortController.abort();
}

export async function postEventStream(prompt: Array<PromptDto>, msgCallback: (data: string) => any, doneCallback: () => void, errorCallback: (err: any) => void) {
    const serverAddress = workspace.getConfiguration("AIACode").get("ServerAddress") as string;
    const maxtokens = workspace.getConfiguration("AIACode").get("ChatMaxTokens") as number;
    const authorization = workspace.getConfiguration("AIACode").get("authorization") as string;
    const modelEnv = workspace.getConfiguration("AIACode").get("RunEnvForLLMs") as string;
    var uri = "";
    var body = {};
    
    if ("CPU with llama.cpp" == modelEnv) {
        uri = "/completion"
        body = {
            "prompt": "|<end>|" + prompt, "n_predict": maxtokens, 
            "temperature": 0.8, "repetition_penalty": 1.2, "top_k":40,  "top_p":0.95, "stream": true, 
            "stop": ["|<end>|", "|end|", "<|endoftext|>", "## human"]
        };
    }

    if ("GPU with TGI toolkit" == modelEnv) {
        // uri = "/generate_stream"
        uri = '/llm-poc/chat/completion?model_name=deepseek&api_version=2023-11-01'
        // uri = "/aiacode-code/assistants"
        body = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": maxtokens,
                "temperature": 0.6, "repetition_penalty": 1.2, "top_p": 0.95, "do_sample": true, 
                "stop": ["|<end>|", "|end|", "<|endoftext|>", "## human"]
            },
            "stream": true
        };
    }
    
    if("TSS AI toolkit" == modelEnv) {
        uri = "/ide-chat"
        body = {
            "messages": prompt,
            "parameters":{
                "max_new_tokens": maxtokens,
                "truncate":4000
            },
            "stream": true
        };
    }
    abortController = new AbortController();
    console.log("uri:" + uri)
    console.log("============body=============");
    console.log(body);
    
    new FetchStream({
        url: serverAddress + uri,
        requestInit: {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization
            },
            body: JSON.stringify(body),
            signal: abortController.signal
        },
        onmessage: msgCallback,
        ondone: doneCallback,
        onerror: errorCallback
    });

}