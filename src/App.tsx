import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LoginHub from "./pages/LoginHub";
import NotFound from "./pages/NotFound";
import FormTemplates from "./pages/FormTemplates";
import FormTemplateEditor from "./pages/FormTemplateEditor";
import JobPostings from "./pages/JobPostings";
import JobPostingForm from "./pages/JobPostingForm";
import JobPostingDetails from "./pages/JobPostingDetails";
import PublicApplication from "./pages/PublicApplication";
import PublicCareers from "./pages/PublicCareers";
import Settings from "./pages/Settings";
import ActivityLog from "./pages/ActivityLog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/LoginHub" element={<LoginHub />} />
          
          {/* Form Templates */}
          <Route path="/formularios" element={<FormTemplates />} />
          <Route path="/formularios/novo" element={<FormTemplateEditor />} />
          <Route path="/formularios/:id" element={<FormTemplateEditor />} />
          
          {/* Job Postings */}
          <Route path="/vagas" element={<JobPostings />} />
          <Route path="/vagas/nova" element={<JobPostingForm />} />
          <Route path="/vagas/:id" element={<JobPostingDetails />} />
          <Route path="/vagas/:id/editar" element={<JobPostingForm />} />
          
          {/* Public Pages */}
          <Route path="/apply/:slug" element={<PublicApplication />} />
          <Route path="/carreiras/:slug" element={<PublicCareers />} />
          
          {/* Settings */}
          <Route path="/configuracoes" element={<Settings />} />
          
          {/* Activity Log (Admin Only) */}
          <Route path="/atividades" element={<ActivityLog />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
