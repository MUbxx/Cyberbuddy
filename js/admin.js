import { auth, db } from "./firebase.js";
import {
    collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* DOM Elements */
const usersList = document.getElementById("usersList");
const coursesList = document.getElementById("coursesList");
const totalUsers = document.getElementById("totalUsers");
const totalCourses = document.getElementById("totalCourses");
const totalEnrollments = document.getElementById("totalEnrollments");

/* Toast Utility */
function toast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2000);
}

/* Auth Check & Admin Verification */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location = "login.html";
        return;
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || snap.data().role !== "admin") {
        alert("Unauthorized Access");
        window.location = "dashboard.html";
        return;
    }
    loadDashboard();
});

/* Dashboard Loader */
async function loadDashboard() {
    usersList.innerHTML = "<tr><td colspan='5' class='p-5 text-center'>Loading...</td></tr>";
    coursesList.innerHTML = "Loading courses...";

    try {
        const usersSnap = await getDocs(collection(db, "users"));
        const coursesSnap = await getDocs(collection(db, "courses"));

        totalUsers.innerText = usersSnap.size;
        totalCourses.innerText = coursesSnap.size;

        let enrollments = 0;
        const courseNames = [];
        
        // Load Courses
        coursesList.innerHTML = "";
        coursesSnap.forEach(c => {
            courseNames.push(c.id);
            coursesList.innerHTML += `
                <div class="flex justify-between glass p-3 rounded mb-2">
                    <div class="flex gap-3 items-center">
                        <img src="${c.data().thumbnail}" class="w-16 h-10 object-cover rounded">
                        <div>
                            <p class="font-bold">${c.id}</p>
                            <p class="text-xs text-gray-400">${c.data().description || ''}</p>
                        </div>
                    </div>
                    <button onclick="deleteCourse('${c.id}')" class="bg-red-500 px-3 py-1 rounded text-xs hover:bg-red-600">Delete</button>
                </div>`;
        });

        // Load Users
        usersList.innerHTML = "";
        usersSnap.forEach(u => {
            const d = u.data();
            const owned = d.purchasedCourses || [];
            enrollments += owned.length;

            const row = document.createElement("tr");
            row.className = "border-b border-gray-800 hover:bg-slate-800/30 transition";
            row.innerHTML = `
                <td class="p-3">${d.name || 'N/A'}</td>
                <td class="p-3 text-gray-400">${d.email}</td>
                <td class="p-3 text-cyan-400 text-xs font-mono">${owned.join(", ") || "None"}</td>
                <td class="p-3">
                    <select id="course-${u.id}" class="bg-gray-900 border border-gray-700 rounded text-xs p-1">
                        <option value="">Select Course</option>
                        ${courseNames.map(c => `<option value="${c}">${c}</option>`).join("")}
                    </select>
                </td>
                <td class="p-3 flex gap-2">
                    <button onclick="grant('${u.id}')" class="bg-cyan-600 hover:bg-cyan-500 px-2 py-1 text-xs rounded">Grant</button>
                    <button onclick="revoke('${u.id}')" class="bg-yellow-600 hover:bg-yellow-500 px-2 py-1 text-xs rounded">Revoke</button>
                    <button onclick="deleteUser('${u.id}')" class="bg-red-600 hover:bg-red-500 px-2 py-1 text-xs rounded"><i class="fas fa-trash"></i></button>
                </td>`;
            usersList.appendChild(row);
        });

        totalEnrollments.innerText = enrollments;
    } catch (err) {
        console.error(err);
        toast("Error loading data");
    }
}

/* ATTACH FUNCTIONS TO WINDOW (Crucial for Modules) */
window.showTab = (id) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
};

window.grant = async (uid) => {
    const course = document.getElementById(`course-${uid}`).value;
    if (!course) return toast("Select a course");
    await updateDoc(doc(db, "users", uid), { purchasedCourses: arrayUnion(course) });
    toast("Access Granted");
    loadDashboard();
};

window.revoke = async (uid) => {
    const course = document.getElementById(`course-${uid}`).value;
    if (!course) return toast("Select a course");
    await updateDoc(doc(db, "users", uid), { purchasedCourses: arrayRemove(course) });
    toast("Access Revoked");
    loadDashboard();
};

window.deleteUser = async (uid) => {
    if (!confirm("Delete this user?")) return;
    await deleteDoc(doc(db, "users", uid));
    toast("User deleted");
    loadDashboard();
};

window.deleteCourse = async (id) => {
    if (!confirm("Delete this course?")) return;
    await deleteDoc(doc(db, "courses", id));
    toast("Course deleted");
    loadDashboard();
};

/* Event Listeners */
document.getElementById("uploadBtn").onclick = async () => {
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const thumbnail = document.getElementById("thumbnail").value;
    const video = document.getElementById("video").value;

    if (!title || !description || !thumbnail || !video) return toast("Fill all fields");

    await setDoc(doc(db, "courses", title), { title, description, thumbnail, video });
    toast("Course uploaded");
    loadDashboard();
};

document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location = "login.html";
};

document.getElementById("resetPassword").onclick = async () => {
    const email = document.getElementById("securityEmail").value;
    if (!email) return toast("Enter email");
    await sendPasswordResetEmail(auth, email);
    toast("Reset link sent");
};

document.getElementById("userSearch").addEventListener("input", function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll("#usersList tr").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
});
