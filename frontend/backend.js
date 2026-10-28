/* Data adapter: browser localStorage for the prototype. Replace with Firebase calls later. */
(() => {
 const KEY="caremesh_demo_v1",today=()=>new Date().toISOString().slice(0,10),plus=n=>{let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)},clone=x=>JSON.parse(JSON.stringify(x));
 const seed={patients:[{id:"PT-1001",name:"Aarav Sharma",dob:"1984-05-12",phone:"Demo contact",clinic:"North Clinic",consent:"Granted",notes:"Sample record only"},{id:"PT-1002",name:"Meera Patel",dob:"1972-09-23",phone:"Demo contact",clinic:"City Health Centre",consent:"Granted",notes:"Sample record only"},{id:"PT-1003",name:"Kabir Singh",dob:"1991-02-14",phone:"Demo contact",clinic:"North Clinic",consent:"Pending",notes:"Sample record only"},{id:"PT-1004",name:"Ananya Das",dob:"1966-11-04",phone:"Demo contact",clinic:"Community Clinic",consent:"Revoked",notes:"Sharing paused until consent is resolved"}],tasks:[{id:"TS-2001",patientId:"PT-1001",title:"Review blood test result",type:"Lab result review",dueDate:plus(-2),priority:"High",status:"Pending",owner:"Care Coordinator",notes:"Confirm result reached clinical team"},{id:"TS-2002",patientId:"PT-1002",title:"Confirm follow-up appointment",type:"Appointment",dueDate:today(),priority:"Medium",status:"In progress",owner:"Care Coordinator",notes:"Sample task"},{id:"TS-2003",patientId:"PT-1001",title:"Check referral receipt",type:"Referral",dueDate:plus(2),priority:"High",status:"Pending",owner:"Care Coordinator",notes:"Receiving clinic acknowledgement needed"},{id:"TS-2004",patientId:"PT-1003",title:"Confirm lab appointment",type:"Lab test",dueDate:plus(1),priority:"Low",status:"Pending",owner:"Lab Staff",notes:"Consent pending; verify access first"}],appointments:[{id:"AP-3001",patientId:"PT-1002",date:plus(1),time:"10:30",provider:"City Health Centre",kind:"Follow-up visit",status:"Confirmed",notes:"Sample appointment"},{id:"AP-3002",patientId:"PT-1001",date:plus(3),time:"14:00",provider:"North Clinic",kind:"Result review",status:"Scheduled",notes:"Sample appointment"}],referrals:[{id:"RF-4001",patientId:"PT-1001",destination:"Cardiology Clinic",reason:"Specialist review requested",date:today(),status:"Sent",owner:"Care Coordinator",notes:"Sample referral"},{id:"RF-4002",patientId:"PT-1002",destination:"Community Imaging Centre",reason:"Imaging coordination",date:plus(-1),status:"Requested",owner:"Care Coordinator",notes:"Awaiting acknowledgement"}],labs:[{id:"LP-5001",patientId:"PT-1001",kind:"Lab test",item:"Routine blood panel",provider:"North Lab",dueDate:plus(-1),status:"Awaiting result",owner:"Lab Staff",notes:"Sample tracking item"},{id:"LP-5002",patientId:"PT-1002",kind:"Pharmacy",item:"Confirm prescription pickup",provider:"Community Pharmacy",dueDate:plus(1),status:"Pharmacy pending",owner:"Pharmacy Staff",notes:"Do not change medication based on tracker"}],alerts:[],activity:[]};
 function load(){try{let x=JSON.parse(localStorage.getItem(KEY));if(x&&x.patients&&x.tasks)return x}catch(e){}localStorage.setItem(KEY,JSON.stringify(seed));return clone(seed)}let db=load();
let firebaseReady=false,remoteRef=null;

async function initFirebase(){
  if(!window.CAREMESH_DB) {
    console.warn("Firestore unavailable; local demo mode active.");
    return false;
  }

  try {
    remoteRef=window.CAREMESH_DB.collection("appData").doc("main");
    const snap=await remoteRef.get();

    if(snap.exists) {
      const remote=snap.data().payload;

      if(!remote || !Array.isArray(remote.patients) || !Array.isArray(remote.tasks)) {
        throw new Error("Firebase document has an invalid data format.");
      }

      db=remote;

      ["patients","tasks","appointments","referrals","labs","alerts","activity"]
        .forEach(k=>{if(!Array.isArray(db[k]))db[k]=[];});

      localStorage.setItem(KEY,JSON.stringify(db));
    } else {
      await remoteRef.set({
        payload:db,
        schemaVersion:1,
        updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    firebaseReady=true;
    console.log("Life Saviour data loaded from Firestore.");
    return true;
  } catch(error) {
    firebaseReady=false;
    remoteRef=null;
    console.error("Firestore setup failed; local demo mode remains active.",error);
    return false;
  }
}
 function save(){
  localStorage.setItem(KEY,JSON.stringify(db));

  if(firebaseReady && remoteRef) {
    remoteRef.set({
      payload:db,
      schemaVersion:1,
      updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error=>{
      console.error("Firestore save failed:",error);
    });
  }
}function log(action,entity,detail){db.activity.unshift({id:"EV-"+Date.now(),at:new Date().toISOString(),actor:window.CareSecurity?.label()||"Demo user",action,entity,detail});db.activity=db.activity.slice(0,300);save()}
 window.CareBackend={initialize:initFirebase,list(t){return clone(db[t]||[])},get(t,id){return clone((db[t]||[]).find(x=>x.id===id)||null)},patient(id){return clone(db.patients.find(x=>x.id===id)||null)},patientName(id){return db.patients.find(x=>x.id===id)?.name||"Unknown patient"},save(t,r){if(!db[t])throw Error("Unknown record type");let isNew=!r.id;if(isNew){let prefix={patients:"PT",tasks:"TS",appointments:"AP",referrals:"RF",labs:"LP"}[t]||"RC";r.id=prefix+"-"+Date.now().toString().slice(-7);r.createdAt=new Date().toISOString()}let i=db[t].findIndex(x=>x.id===r.id);if(i>=0)db[t][i]={...db[t][i],...r};else db[t].unshift(r);save();log(isNew?"Created":"Updated",t,`${r.id}: ${r.title||r.name||r.item||r.destination||r.kind||"record"}`);return clone(r)},update(t,id,patch){let i=(db[t]||[]).findIndex(x=>x.id===id);if(i<0)throw Error("Record not found");db[t][i]={...db[t][i],...patch,updatedAt:new Date().toISOString()};save();log("Updated",t,`${id}: ${Object.keys(patch).join(", ")}`);return clone(db[t][i])},replaceAlerts(a){db.alerts=clone(a);save()},log,exportData(){return clone(db)}};
})();
