"use strict"

import { FrappeForm } from "@anygridtech/frappe-types/client/frappe/core";

declare global {
  interface Window {
    workflow_preactions?: Record<string, Record<string, (frm: FrappeForm) => Promise<void>>>;
  }
  namespace agt {
    namespace workflow {
      let frappe_pre_action: () => Promise<void>;
    }
  }
}

frappe.provide("agt.workflow.frappe_pre_action");

agt.workflow.frappe_pre_action = async () => {
  // run all function recursively
  if (!window.workflow_preactions) return;
  
  const cur_frm = window.cur_frm;
  if (!cur_frm) return;
  
  // Use for..of instead of forEach to handle asynchronous operations correctly
  for (const [workflow_action, routine] of Object.entries(window.workflow_preactions)) {
    if (cur_frm.states?.frm?.selected_workflow_action !== workflow_action) continue;
    
    // Process each pre_action function sequentially
    for (const [preaction, fnc] of Object.entries(routine)) {
      try {
        console.log(`Running function for ${workflow_action} - ${preaction}`);
        await fnc(cur_frm);
      } catch (e) {
        console.error("Preaction error", e);
        // Convert the error to string to avoid type issues
        const errorMessage = e instanceof Error ? e.message : String(e);
        frappe.throw({
          title: __("Error"),
          message: errorMessage
        });
        // Break execution after the first error
        break;
      }
    }
  }
}