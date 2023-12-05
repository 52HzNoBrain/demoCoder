/* eslint-disable */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { workspace } from "vscode";
import { translate } from "./LanguageHelper";

// Define an interface to describe the structure of the completion response
export interface CompletionResponse {
    "generated_text"?: string;
}

// Asynchronous function to send a code completion request to the server
export async function postCompletion(fimPrefixCode: string, fimSuffixCode: string): Promise<string | undefined> {
    // Get the server address, maximum completion tokens, and runtime environment from the configuration
    const serverAddress = workspace.getConfiguration("AIACode").get("ServerAddress") as string;
    let maxtokens = workspace.getConfiguration("AIACode").get("CompletionMaxTokens") as number;
    const modelEnv = workspace.getConfiguration("AIACode").get("RunEnvForLLMs") as string;

    // If the runtime environment is "CPU with llama.cpp"
    if ("CPU with llama.cpp" == modelEnv) {
        // Construct the request data
        let data = {
            "input_prefix": fimPrefixCode, "input_suffix": fimSuffixCode,
            "n_predict": maxtokens, "temperature": 0.2, "repetition_penalty": 1.0, "top_k": 10, "top_p": 0.95,
            "stop": ["|<end>|", "|end|", "<|endoftext|>", "## human"]
        };

        // Log the request data to the console
        console.debug("request.data:", data)

        // Send a POST request to the "/infill" path on the server
        const response = await axiosInstance.post(serverAddress + "/infill", data);

        // Process the server response data
        var content = "";
        const respData = response.data as string;
        const dataList = respData.split("\n\n");
        for (var chunk of dataList) {
            if (chunk.startsWith("data:")) {
                content += JSON.parse(chunk.substring(5)).content
            }
        }

        // Log the response data to the console
        console.debug("response.data:", content)

        // Return the processed content
        return content.replace("<|endoftext|>", "");
    }

    // If the runtime environment is "GPU with TGI toolkit"
    if ("GPU with TGI toolkit" == modelEnv) {
        // Construct the request data
        const prompt = `<fim_prefix>${fimPrefixCode}<fim_suffix>${fimSuffixCode}<fim_middle>`;
        let data = {
            "inputs": fimPrefixCode,
            "parameters": {
                "max_new_tokens": maxtokens, "temperature": 0.2, "repetition_penalty": 1.2, "top_p": 0.99, "do_sample": true,
                "stop": ["|<end>|", "|end|", "<|endoftext|>", "## human"]
            }
        };

        // Log the request data to the console
        console.debug("request.data:", data)

        // Send a POST request to the "/generate" path on the server
        const uri = "/generate"
        const response = await axiosInstance.post<CompletionResponse>(serverAddress + uri, data);

        // Log the response data to the console
        console.debug("response.data:", response.data)

        // Return the processed generated text
        return response.data.generated_text?.replace("<|endoftext|>", "");
    }

    // If the runtime environment is "TSS AI toolkit"
    if ("TSS AI toolkit" == modelEnv) {
        // Construct the request data
        let data = {
            "sys_code": "",
            "pre_code": fimPrefixCode,
            "suf_code": fimSuffixCode,
            "parameters": {
                "max_new_tokens": maxtokens
            }
        };
        
        // Log the request data to the console
        console.info("request.data:", data)

        // Send a POST request to the "/inline-completion" path on the server
        const uri = "/inline-completion"
        const response = await axiosInstance.post<CompletionResponse>(serverAddress + uri, data);

        // Log the response data to the console
        console.info("response.data:", response.data)

        // Return the processed generated text
        return response.data.generated_text;
    }
}

// Create an Axios instance for making HTTP requests
const axiosInstance: AxiosInstance = axios.create({
    timeout: 60000,
    timeoutErrorMessage: translate("timeout")
});

// Axios interceptors for handling logic before sending requests and after receiving responses
axiosInstance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
        // Add authorization information to the request headers
        if(config.headers){
        const authorization = workspace.getConfiguration("AIACode").get("authorization") as string;
            config.headers['authorization'] = authorization ;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    },
);

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: any) => {
        return Promise.reject(error);
    },
);