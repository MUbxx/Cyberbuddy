import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
onSnapshot
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");
const certList = document.getElementById("certList");
const invoiceList = document.getElementById("invoiceList");

let userData = null;


/* AUTH CHECK */

onAuthStateChanged(auth, async (user) => {

if(!user){
window.location="login.html";
return;
}

const userRef = doc(db,"users",user.uid);

/* realtime listener */

onSnapshot(userRef,(snap)=>{

userData = snap.data();

loadCourses();
loadCertificates();
loadInvoices();

});

});



/* LOAD COURSES */

async function loadCourses(){

if(!userData) return;

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const coursesSnap = await getDocs(collection(db,"courses"));

coursesSnap.forEach(course=>{

const data = course.data();
const courseId = course.id;

const access =
userData.purchasedCourses &&
userData.purchasedCourses.includes(courseId);

const card = `

<div class="glass rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition">

<img src="${data.image || 'https://via.placeholder.com/400x200'}"
class="w-full h-40 object-cover">

<div class="p-5">

<h3 class="font-bold text-lg mb-2">
${data.title}
</h3>

<p class="text-sm text-slate-400 mb-4">
${data.description || ""}
</p>

${
access
?
`<a href="course.html?id=${courseId}"
class="bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-bold">
Start Learning
</a>`
:
`<button class="bg-slate-700 px-4 py-2 rounded-lg text-sm text-slate-400">
Locked
</button>`
}

</div>

</div>

`;

coursesGrid.innerHTML += card;

if(access){
myCoursesGrid.innerHTML += card;
}

});

}



/* LOAD CERTIFICATES */

async function loadCertificates(){

if(!certList) return;

certList.innerHTML="Loading certificates...";

try{

const res = await fetch(
"https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json"
);

const data = await res.json();

const user = auth.currentUser;

if(!data.certificates){
certList.innerHTML="No certificates available";
return;
}

const userCerts = data.certificates.filter(cert =>
cert.email.toLowerCase() === user.email.toLowerCase()
);

certList.innerHTML="";

if(userCerts.length===0){
certList.innerHTML="No certificates found";
return;
}

userCerts.forEach(cert=>{

certList.innerHTML += `

<div class="glass p-5 rounded-xl flex justify-between">

<div>

<h4 class="font-bold text-blue-400">
${cert.course}
</h4>

<p class="text-xs text-slate-400">
${cert.type} • ${cert.duration}
</p>

</div>

<a href="certificate.html?id=${cert.certId}"
class="bg-blue-600 px-4 py-2 rounded-lg text-xs">
View
</a>

</div>

`;

});

}catch(err){

console.error(err);

certList.innerHTML="Failed to load certificates";

}

}



/* LOAD BILLING */

async function loadInvoices(){

if(!invoiceList) return;

invoiceList.innerHTML="Loading billing records...";

try{

const res = await fetch(
"https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json"
);

const bills = await res.json();

const user = auth.currentUser;

const userBills = bills.filter(bill =>
bill.email.toLowerCase() === user.email.toLowerCase()
);

invoiceList.innerHTML="";

if(userBills.length===0){

invoiceList.innerHTML="No billing history";

return;

}

userBills.forEach(bill=>{

invoiceList.innerHTML += `

<div class="glass p-5 rounded-xl flex justify-between">

<div>

<h4 class="font-bold text-green-400">
${bill.course}
</h4>

<p class="text-xs text-slate-400">
₹${bill.amount} • ${bill.date}
</p>

</div>

<a href="${bill.verifyUrl}"
target="_blank"
class="bg-slate-800 px-4 py-2 rounded-lg text-xs">
Verify
</a>

</div>

`;

});

}catch(err){

console.error(err);

invoiceList.innerHTML="Failed to load billing data";

}

}



/* PASSWORD RESET */

const resetBtn = document.getElementById("resetBtn");

if(resetBtn){

resetBtn.onclick = async()=>{

const user = auth.currentUser;

await sendPasswordResetEmail(auth,user.email);

alert("Password reset email sent");

};

}



/* LOGOUT */

const logoutBtn = document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.onclick = async()=>{

await signOut(auth);

window.location="login.html";

};

}
