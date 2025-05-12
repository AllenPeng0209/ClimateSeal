import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = () => {
    // Use Response.redirect to ensure proper redirection
    return new Response("", {
        status: 302,
        headers: {
            Location: "/dashboard/overview",
        },
    });
}; 