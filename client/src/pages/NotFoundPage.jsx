import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "../components/ui/button";
import { StatusScreen } from "../components/common/StatusScreen";

export function NotFoundPage() {
  return (
    <StatusScreen
      icon={AlertTriangle}
      tone="warning"
      code="404"
      title="Page Not Found"
      description="The assessment or dashboard view you are trying to access does not exist or may have been relocated."
    >
      <Button asChild>
        <Link to="/" className="inline-flex items-center gap-2">
          <Home size={16} /> Return to Portal
        </Link>
      </Button>
    </StatusScreen>
  );
}
