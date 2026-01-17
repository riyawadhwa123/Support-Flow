---
description: How to share the application with others (Deployment & Tunneling)
---

To open this application on another person's laptop, you cannot use the `localhost` link because that only works on your own computer. You have two main options:

# Option 1: Deploy to Vercel (Recommended for Permanent Link)
This gives you a permanent public URL (e.g., `https://your-app.vercel.app`) that anyone can access.

1.  **Push to GitHub**:
    *   Create a new repository on GitHub.
    *   Push your code to it.

2.  **Deploy on Vercel**:
    *   Go to [Vercel.com](https://vercel.com) and sign up/login.
    *   Click "Add New..." -> "Project".
    *   Import your GitHub repository.

3.  **Configure Environment Variables**:
    *   In the Vercel project settings, go to **Settings** -> **Environment Variables**.
    *   Add the following variables (copy them from your `.env.local` file):
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `ELEVENLABS_API_KEY`

4.  **Deploy**:
    *   Click "Deploy". Vercel will build your app and give you a link.
    *   Share this link with anyone!

# Option 2: Use ngrok (Quick & Temporary)
This creates a temporary public link to your running localhost server. Good for quick demos.

1.  **Install ngrok**:
    *   Download from [ngrok.com](https://ngrok.com).
    *   Sign up and connect your account.

2.  **Start the Tunnel**:
    *   Make sure your app is running (`npm run dev`).
    *   Open a new terminal and run:
        ```bash
        ngrok http 3001
        ```
        (Replace `3001` with your running port).

3.  **Share the Link**:
    *   ngrok will show a URL like `https://random-name.ngrok-free.app`.
    *   Send this link to the other person.
    *   **Note**: The link stops working when you close the terminal.
