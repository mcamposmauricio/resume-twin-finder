import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PDF_BASE64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EtT2JsaXF1ZSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjMgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAxMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA5IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9Db250ZW50cyAxMSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA5IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago3IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgOSAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjggMCBvYmoKPDwKL0F1dGhvciAoXChhbm9ueW1vdXNcKSkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDQwOTE1MTIwMCswMCcwMCcpIC9DcmVhdG9yIChcKHVuc3BlY2lmaWVkXCkpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDQwOTE1MTIwMCswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0IChcKHVuc3BlY2lmaWVkXCkpIC9UaXRsZSAoXChhbm9ueW1vdXNcKSkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9Db3VudCAyIC9LaWRzIFsgNSAwIFIgNiAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjEwIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE4MTAKPj4Kc3RyZWFtCkdhdE08Z04pJSwmOk86U2xxOnVVZXRFRSw3KG5rSmpdJkF0MVNXPHAqUEVSQCxmOmMzTCoyYS4/ZikkW0NELEJcak8kTGMnJmAzMmg2Um9SSjtrWUZKKCJKV2VJNCg1I1M3NVEkUXUmJl88X0BxWmEzRz9BQSw7az1DRGFQJixMYjQsKGo5Um4pOlFANFBxMzVAKEJfMFwzPSFzTFxTQV0wQCpIQWZpJ1tXOmtdIjM8aFh0XEouVUhaW2JZI2MpPigpTmgiPW5RKTIzYiwuZ2UjMyk2YDk0UiwsW0g9KlQjIys1c29QY105MnBBLlJaIyVTLEojPi5aXUY8Yk8jcEdNP2Vha09pXEEhMSVRYCIraiEtbXA4aCE8PGdQNVhJcVxiO0drNiJvX1U/MiZNZWg6SzxRSG0wMFJvMWsmRmtTTGhXPzpGJUJkMzIhPHNqUUxSa2RJX2oyOC0rR3Vtbi5DU0tFNmZeMFRDSTosVF8jKGJjVW9kXyEiV0FvSGBpOGMzQCMsbCVnS2leMSVkSVstKkYrPlc0XmlSTmZuVU0+RFQyZD01dFBEaG5GcWJUIWc6a11mY0EoP04qdXIoRHFSaVciRGJQPzxpQmxRXWQ4aWsrRyVuMHA3VlEjX0E6Lj9hOVhYZDx0Qlk6NzYsMFhNQlVTUHEvISNHZXFObFcoZy9AUmE4P1FrSEpMJj1ZbDFXVF9HSGlncDc0SDBvVFlfQzBLVl81MVNYV1tDZnJdTURmQnRgYiE6QyRvWCErKC46a2llT0NibzI3JyRvImZjUSIvMWo6Q1FBQSo1P1xoWnRwIy9xI28lKEdtcGFBPiIxY148bTYiSysoJCtOVG5OJTdfPDdhNzVnMCRWY2g/O3JhdUtFWmtQJWljYGtabCguM0VuKFc1O0peS0xvIVtXRCVkNW5xYGlYRkUjc10jS2E+IWRdW1JMcmZlJkgjT2pca1FQM2VaMTBTcklCWHBbTW9YVCJEcGQxRThuTGFZdUcrVCciZC5tNjk/RE9AREZSKyhmYWA7S1NDWVxgPDxqYG1WSSVJRl1NUy0vOjxwbUdKTz9rZU1PdF9gYnFYOWhUR0E8SDknLEpASlg1REhJLic/TFVkLmU7QjRbPyddPV01dTFSZVJyPmVpNUlFPShmbkxwdUtkSVM6UD07ZilWW1pwZl0ibV1cYWRbRjlyb1ZsLDdxZWBuKG9iJy0qS1ZBbV5uNChbL2gxQmIzZitvXkg4clZVPzZcNDNwKyVkUEpONms0X0BYPyVgPjwpW0AvblhVU2EmcWlVRG8oRzQmIStfaShxVHVTOitFVVZzQDxBUShrITFoOjQwRSNuL3VQY2VaPDZFYCUjXENAP11QRS5ccjI4KjdoUTR0PihlST51QTBhMSlnNlJVRDgzYC82VU9MKTVNNVZUKzs/UWw5J1JGRD4nZFk6PEU5JU4+OzA2P3I8UzpQbik5IkRpbiM3O0hUOiMocFtIWCpEV04yVHFPOERgXm9LKiVhbmQyVztqVU9TIjdCXjtDUFgtNTNNZEpNak5DMjZpaDRCZT8sa29ub2Y6XHRsMm5dTWVnTVp1LmpIYnJxL3FpQEVgYEZiLkJrUWUkI0k/Kz1gbiNlS3JWOSdsNmwhOD87aVVqISg7Wl1JQXI9aC9EVThWOldfZWJhanFJMlgyPm4kLjlAUj4jMkclR0ByOzhsTktXN2ZUOUclQyRUZjpsOGNXVz5ARDFAWT1vYV9CK0w2UFdFOFBMNF1iMEllS1VJKGU3bWkqVDRJVVtBYm1UMz9aI1AraDtGXXIxX21YPnVIbGBmRS5xNiVNV3MqOGFSbT9bb0w5O0l0OkxXSS0kNzlFcFotbiRfNSVSW0QkKXIlVlFqb2cjOnRlRzVCTkRlbUk2Li1kZ19XZEBbam8kZGdaPjwzdDFlNEgsayRsTTAyMGwkVlsrPSNAVi44Tk5jO1N0Ol9MLjM/T1VUZFpwYVlGZlNRXSpTJSYqa2ovOG8hPXA8USRgN2RCNl0pVlFjL0ozKkRDRjVEK0J0U2xSPlFpQmJzSz4xaF9YYWxjbVBQODlzYXVoPm1qT2E3WzdRWUBsbDtdQz4rWT9WZl0vSytnQChmUWE+ZlVGKmhLblRvRkFNKz1uczBkPmtUcjhEN2g2cD1XV2lcL1FJLipeV01mK2IsKz5tckIwRmpWYi5IRHJQVm83Q1w/Z1FCPi0/XStKIipeaVxJcSlfYVpxNEpcJ15BTzFcKy9pJkc0bUYnM24qQSplUyY2PkwvKkpgaVxMJkonWG5RSiZLNk0vL3EqSG0rY0dpcGY/cWY2bnIpJjc9S05gbGgrJ1lWaU8kZVpeYUZeYCxHMz9FNzpARS1rO0s1UHJOVVdtITdBc1dzNWBpPXRHODE4K3JXaSU0YWwhfj5lbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE4Ngo+PgpzdHJlYW0KR2FwcFdfJFwlNSUjNDUhTVo6MjNXKGlcXl0qXG1zSm1zYlJOM05pMjNHZUJlYylTaHErWEhrSTY4MCVwWzJqZi1BJTxoRyJvIlpePTVYMWhYSWI7dVFlcHU3RiZZYDtkVCFoXjMqP1ZbSiFYISxjbmgvLkIiIit0MzFwUTw0XGciXl05S0pJVVVmRjVgcVA6IVA/cVA1KmwyJVNTYHJecjpmcTQlLXFqJT1dVTheWjk7IkomR3E/aX4+ZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMTIKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDYxIDAwMDAwIG4gCjAwMDAwMDAxMTIgMDAwMDAgbiAKMDAwMDAwMDIxOSAwMDAwMCBuIAowMDAwMDAwMzMxIDAwMDAwIG4gCjAwMDAwMDA0NDYgMDAwMDAgbiAKMDAwMDAwMDY1MCAwMDAwMCBuIAowMDAwMDAwODU0IDAwMDAwIG4gCjAwMDAwMDA5MjIgMDAwMDAgbiAKMDAwMDAwMTIwMiAwMDAwMCBuIAowMDAwMDAxMjY3IDAwMDAwIG4gCjAwMDAwMDMxNjkgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8ZTI1OTk2ZmZlMGUwYTBiM2I3Mjk0MDI4NjEzNDkzN2I+PGUyNTk5NmZmZTBlMGEwYjNiNzI5NDAyODYxMzQ5MzdiPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA4IDAgUgovUm9vdCA3IDAgUgovU2l6ZSAxMgo+PgpzdGFydHhyZWYKMzQ0NgolJUVPRgo=";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const pdfBytes = base64ToUint8Array(PDF_BASE64);
    const userId = "d1a8e600-e028-4a20-8b34-7f9b7e3833d9";

    // Get all applications for this user's jobs
    const { data: apps, error: appsErr } = await supabase
      .from("job_applications")
      .select("id, applicant_name, resume_url, resume_filename, job_posting_id, job_postings!inner(user_id)")
      .eq("job_postings.user_id", userId);

    if (appsErr) throw appsErr;

    const results: string[] = [];

    for (const app of apps || []) {
      const uuid = crypto.randomUUID();
      const safeName = (app.applicant_name || "candidato").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const newPath = `${app.job_posting_id}/${uuid}_${safeName}.pdf`;

      // Upload PDF
      const { error: uploadErr } = await supabase.storage
        .from("resumes")
        .upload(newPath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        results.push(`UPLOAD_ERR ${app.id}: ${uploadErr.message}`);
        continue;
      }

      // Update application record
      const { error: updateErr } = await supabase
        .from("job_applications")
        .update({
          resume_url: newPath,
          resume_filename: `curriculo_${safeName}.pdf`,
        })
        .eq("id", app.id);

      if (updateErr) {
        results.push(`UPDATE_ERR ${app.id}: ${updateErr.message}`);
      } else {
        results.push(`OK ${app.id}: ${newPath}`);
      }
    }

    // Clean up old demo/ files
    const { data: oldFiles } = await supabase.storage
      .from("resumes")
      .list("demo", { limit: 100 });

    if (oldFiles && oldFiles.length > 0) {
      const paths = oldFiles.map((f) => `demo/${f.name}`);
      await supabase.storage.from("resumes").remove(paths);
      results.push(`Cleaned ${paths.length} old demo files`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
