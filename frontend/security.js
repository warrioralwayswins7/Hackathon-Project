/* UI demo checks only. Production authorization must be enforced by Firebase Rules/server. */
(() => {
 const perms={coordinator:["read","patients","tasks","appointments","referrals","labs","escalate","export"],clinician:["read","tasks","appointments","referrals","labs","escalate"],lab:["read","labs"],pharmacy:["read","labs"],viewer:["read"]};
 window.CareSecurity={role:()=>document.getElementById("roleSelect")?.value||"coordinator",can(p){return (perms[this.role()]||[]).includes(p)},canAccessPatient(p){return !!p&&(p.consent==="Granted"||(this.role()==="coordinator"&&p.consent==="Pending"))},label(){return ({coordinator:"Care Coordinator",clinician:"Clinician",lab:"Lab Staff",pharmacy:"Pharmacy Staff",viewer:"Read-only Viewer"})[this.role()]||"Unknown"}};
})();
