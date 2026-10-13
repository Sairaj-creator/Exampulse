import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { StatusScreen } from "../components/common/StatusScreen";

export function ForbiddenPage() {
  return (
    <StatusScreen
      icon={ShieldAlert}
      tone="danger"
      code="403"
      title="Access Restricted"
      description="Your current role permissions do not authorize access to this requested examination or management resource."
    >
      <Button asChild>
        <Link to="/" className="inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Your Dashboard
        </Link>
      </Button>
    </StatusScreen>
  );
}
