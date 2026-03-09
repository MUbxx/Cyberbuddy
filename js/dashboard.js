import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
onSnapshot,
updateDoc
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


/* DOM */

const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");
const certList = document.getElementById("certList");
const invoiceList = document.getElementById("invoiceList");

const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn");

const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");

const statCourses = document.getElementById("statCourses");
const statCertificates = document.getElementById("statCertificates");

const searchInput = document.getElementById("searchCourse");

let userData = null;
let allCourses = [];


/* ===============================
   AUTH CHECK
================================ */

onAuthStateChanged(auth, async (user)=>{

if(!user){
window.location="login.html";
return;
}

// FIX: Load external data once on login to avoid redundant fetching
loadCertificates(user);
loadInvoices(user);

const userRef = doc(db,"users",user.uid);

/* realtime updates */

onSnapshot(userRef,(snap)=>{

userData = snap.data();

editName.value = userData.name || "";
editPhone.value = userData.phone || "";

loadCourses();
// Removed loadCertificates and loadInvoices from here 
// to prevent re-fetching every time profile is saved.

});

});



/* ===============================
   LOAD COURSES
================================ */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const coursesSnap = await getDocs(collection(db,"courses"));

allCourses = [];

coursesSnap.forEach(course=>{

const data = course.data();
const courseId = course.id;

allCourses.push({id:courseId,...data});

const access =
userData.purchasedCourses &&
userData.purchasedCourses.includes(courseId);

const card = createCourseCard(courseId,data,access);

coursesGrid.innerHTML += card;

if(access){
myCoursesGrid.innerHTML += card;
}

});

/* update stats */

statCourses.innerText =
userData.purchasedCourses ? userData.purchasedCourses.length : 0;

}



/* ===============================
   COURSE CARD
================================ */

function createCourseCard(courseId,data,access){

return `

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
`<a href="https://mubyyy404.github.io/Cyber-Buddy/verify-certificate.html?id=${courseId}"
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

}



/* ===============================
   COURSE SEARCH
================================ */

if(searchInput){

searchInput.addEventListener("input",()=>{

const query = searchInput.value.toLowerCase();

coursesGrid.innerHTML="";

allCourses.forEach(course=>{

if(course.title.toLowerCase().includes(query)){

const access =
userData.purchasedCourses &&
userData.purchasedCourses.includes(course.id);

coursesGrid.innerHTML +=
createCourseCard(course.id,course,access);

}

});

});

}



/* ===============================
   CERTIFICATES (FIXED)
================================ */
async function loadCertificates(user) {
    if (!user || !user.email) return; // Guard clause
    certList.innerHTML = "Loading certificates...";

    try {
        const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json");
        const data = await res.json();

        // Debugging: See what is actually in your JSON vs your login
        console.log("Current User Email:", user.email.toLowerCase());
        console.log("JSON Data Received:", data.certificates);

        const userCerts = data.certificates.filter(cert => {
            return cert.email && cert.email.toLowerCase().trim() === user.email.toLowerCase().trim();
        });

        certList.innerHTML = "";

        if (userCerts.length === 0) {
            certList.innerHTML = "No certificates found for " + user.email;
        } else {
            userCerts.forEach(cert => {
                certList.innerHTML += `
                <div class="glass p-5 rounded-xl flex justify-between mb-3">
                    <div>
                        <h4 class="font-bold text-blue-400">${cert.course}</h4>
                        <p class="text-xs text-slate-400">${cert.type} • ${cert.duration}</p>
                    </div>
                    <a href="certificate.html?id=${cert.certId}" class="bg-blue-600 px-4 py-2 rounded-lg text-xs">View</a>
                </div>`;
            });
        }
        statCertificates.innerText = userCerts.length;
    } catch (err) {
        console.error("Cert Error:", err);
        certList.innerHTML = "Error parsing certificate data";
    }
}

/* ===============================
   BILLING (FIXED)
================================ */
async function loadInvoices(user) {
    if (!user || !user.email) return;
    invoiceList.innerHTML = "Loading billing...";

    try {
        const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json");
        const bills = await res.json();

        const userBills = bills.filter(bill => {
            return bill.email && bill.email.toLowerCase().trim() === user.email.toLowerCase().trim();
        });

        invoiceList.innerHTML = "";

        if (userBills.length === 0) {
            invoiceList.innerHTML = "No billing history found";
        } else {
            userBills.forEach(bill => {
                invoiceList.innerHTML += `
                <div class="glass p-5 rounded-xl flex justify-between mb-3">
                    <div>
                        <h4 class="font-bold text-green-400">${bill.course}</h4>
                        <p class="text-xs text-slate-400">₹${bill.amount} • ${bill.date}</p>
                    </div>
                    <a href="${bill.verifyUrl}" target="_blank" class="bg-slate-800 px-4 py-2 rounded-lg text-xs">Verify</a>
                </div>`;
            });
        }
    } catch (err) {
        console.error("Billing Error:", err);
        invoiceList.innerHTML = "Error parsing billing data";
    }
}



/* ===============================
   PROFILE UPDATE
================================ */

document.getElementById("saveProfile").onclick = async()=>{

const user = auth.currentUser;

const ref = doc(db,"users",user.uid);

await updateDoc(ref,{
name: editName.value,
phone: editPhone.value
});

alert("Profile updated");

};



/* ===============================
   PASSWORD RESET
================================ */

if(resetBtn){

resetBtn.onclick = async()=>{

const user = auth.currentUser;

await sendPasswordResetEmail(auth,user.email);

alert("Password reset email sent");

};

}



/* ===============================
   LOGOUT
================================ */

logoutBtn.onclick = async()=>{

await signOut(auth);

window.location="login.html";

};



/* ===============================
   SIDEBAR TOGGLE
================================ */

document.getElementById("toggleSidebar").onclick=()=>{

document.getElementById("sidebar")
.classList.toggle("collapsed");

};



/* ===============================
   TAB SWITCHING
================================ */

document.querySelectorAll(".navBtn").forEach(btn=>{

btn.onclick = ()=>{

document.querySelectorAll(".tab")
.forEach(tab=>tab.classList.remove("active"));

document.getElementById(btn.dataset.tab)
.classList.add("active");

};

});


