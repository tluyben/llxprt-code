# Authentication Setup

LLxprt Code allows you to authenticate to Google's AI services at your option. You can also use other providers like OpenAI, Anthropic, or local models without any Google authentication.

## Provider Authentication Options

### For Google Services (Optional)

If you want to use Google's Gemini models, including their free tier offerings, you can authenticate using **one** of the following methods:

1.  **Login with Google (Gemini Code Assist):**
    - Use this option to log in with your google account.
    - During initial startup, LLxprt Code will direct you to a webpage for authentication. Once authenticated, your credentials will be cached locally so the web login can be skipped on subsequent runs.
    - Note that the web login must be done in a browser that can communicate with the machine LLxprt Code is being run from. (Specifically, the browser will be redirected to a localhost url that LLxprt Code will be listening on).
    - <a id="workspace-gca">Users may have to specify a GOOGLE_CLOUD_PROJECT if:</a>
      1. You have a Google Workspace account. Google Workspace is a paid service for businesses and organizations that provides a suite of productivity tools, including a custom email domain (e.g. your-name@your-company.com), enhanced security features, and administrative controls. These accounts are often managed by an employer or school.
      1. You have received a Gemini Code Assist license through the [Google Developer Program](https://developers.google.com/program/plans-and-pricing) (including qualified Google Developer Experts)
      1. You have been assigned a license to a current Gemini Code Assist standard or enterprise subscription.
      1. You are using the product outside the [supported regions](https://developers.google.com/gemini-code-assist/resources/available-locations) for free individual usage.
      1. You are a Google account holder under the age of 18
      - If you fall into one of these categories, you must first configure a Google Cloud Project Id to use, [enable the Gemini for Cloud API](https://cloud.google.com/gemini/docs/discover/set-up-gemini#enable-api) and [configure access permissions](https://cloud.google.com/gemini/docs/discover/set-up-gemini#grant-iam).

      You can temporarily set the environment variable in your current shell session using the following command:

      ```bash
      export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
      ```

      - For repeated use, you can add the environment variable to your [.env file](#persisting-environment-variables-with-env-files) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following command adds the environment variable to a `~/.bashrc` file:

      ```bash
      echo 'export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"' >> ~/.bashrc
      source ~/.bashrc
      ```

2.  **<a id="gemini-api-key"></a>Gemini API key:**
    - Obtain your API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    - Set the `GEMINI_API_KEY` environment variable. In the following methods, replace `YOUR_GEMINI_API_KEY` with the API key you obtained from Google AI Studio:
      - You can temporarily set the environment variable in your current shell session using the following command:
        ```bash
        export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
        ```
      - For repeated use, you can add the environment variable to your [.env file](#persisting-environment-variables-with-env-files) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following command adds the environment variable to a `~/.bashrc` file:
        ```bash
        echo 'export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"' >> ~/.bashrc
        source ~/.bashrc
        ```

3.  **Vertex AI:**
    - Obtain your Google Cloud API key: [Get an API Key](https://cloud.google.com/vertex-ai/generative-ai/docs/start/api-keys?usertype=newuser)
      - Set the `GOOGLE_API_KEY` environment variable. In the following methods, replace `YOUR_GOOGLE_API_KEY` with your Vertex AI API key:
        - You can temporarily set these environment variables in your current shell session using the following commands:
          ```bash
          export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
          ```
        - For repeated use, you can add the environment variables to your [.env file](#persisting-environment-variables-with-env-files) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following commands add the environment variables to a `~/.bashrc` file:
          ```bash
          echo 'export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"' >> ~/.bashrc
          source ~/.bashrc
          ```
    - To use Application Default Credentials (ADC), use the following command:
      - Ensure you have a Google Cloud project and have enabled the Vertex AI API.
        ```bash
        gcloud auth application-default login
        ```
        For more information, see [Set up Application Default Credentials for Google Cloud](https://cloud.google.com/docs/authentication/provide-credentials-adc).
      - Set the `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` environment variables. In the following methods, replace `YOUR_PROJECT_ID` and `YOUR_PROJECT_LOCATION` with the relevant values for your project:
        - You can temporarily set these environment variables in your current shell session using the following commands:
          ```bash
          export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
          export GOOGLE_CLOUD_LOCATION="YOUR_PROJECT_LOCATION" # e.g., us-central1
          ```
        - For repeated use, you can add the environment variables to your [.env file](#persisting-environment-variables-with-env-files) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following commands add the environment variables to a `~/.bashrc` file:
          ```bash
          echo 'export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"' >> ~/.bashrc
          echo 'export GOOGLE_CLOUD_LOCATION="YOUR_PROJECT_LOCATION"' >> ~/.bashrc
          source ~/.bashrc
          ```
4.  **Cloud Shell:**
    - This option is only available when running in a Google Cloud Shell environment.
    - It automatically uses the credentials of the logged-in user in the Cloud Shell environment.
    - This is the default authentication method when running in Cloud Shell and no other method is configured.

### Persisting Environment Variables with `.env` Files

You can create a **`.llxprt/.env`** file in your project directory or in your home directory. Creating a plain **`.env`** file also works, but `.llxprt/.env` is recommended to keep Gemini variables isolated from other tools.

LLxprt Code automatically loads environment variables from the **first** `.env` file it finds, using the following search order:

1. Starting in the **current directory** and moving upward toward `/`, for each directory it checks:
   1. `.llxprt/.env`
   2. `.env`
2. If no file is found, it falls back to your **home directory**:
   - `~/.llxprt/.env`
   - `~/.env`

> **Important:** The search stops at the **first** file encountered—variables are **not merged** across multiple files.

#### Examples

**Project-specific overrides** (take precedence when you are inside the project):

```bash
mkdir -p .llxprt
echo 'GOOGLE_CLOUD_PROJECT="your-project-id"' >> .llxprt/.env
```

**User-wide settings** (available in every directory):

```bash
mkdir -p ~/.llxprt
cat >> ~/.llxprt/.env <<'EOF'
GOOGLE_CLOUD_PROJECT="your-project-id"
GEMINI_API_KEY="your-gemini-api-key"
EOF
```

### For Other Providers

LLxprt Code supports multiple providers without requiring Google authentication:

#### OpenAI

- Set up using `/provider openai` and `/key sk-your-openai-key`
- Or set `OPENAI_API_KEY` environment variable
- No additional authentication required

#### Anthropic

- Set up using `/provider anthropic` and `/key sk-ant-your-key`
- Or set `ANTHROPIC_API_KEY` environment variable
- No additional authentication required

#### Local Models

- Set up using `/provider openai` and `/baseurl http://localhost:1234/v1/`
- No authentication required for local models
- Works with LM Studio, llama.cpp, and other OpenAI-compatible servers

#### OpenRouter/Fireworks

- Use `/provider openai` with appropriate `/baseurl` and `/key`
- Authentication via API key only

See the [Provider Configuration](../README.md#provider-configuration) section for detailed setup instructions.
