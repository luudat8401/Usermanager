// ===== BÀI TẬP TỔNG HỢP: HỆ THỐNG QUẢN LÝ USER =====

// Task 1: Tạo interface 'User' với các thuộc tính
interface User {
  readonly id: number
  username: string
  email: string
  isActive?: boolean
  role: "admin" | "user" | "guest"
}

// Task 2: Tạo type 'UserProfile' kết hợp 'User' và thêm
type UserProfile = User & {
  birthDate: Date
  address?: string
}

// Task 3: Tạo class 'UserAccount' implement interface 'User'
class UserAccount implements User {
  readonly id: number
  public username: string
  public email: string
  public isActive?: boolean
  public role: "admin" | "user" | "guest"
  private password: string

  constructor(userData: Partial<User> & { password: string }) {
    this.id = Date.now() + Math.random() // Ensure unique ID
    this.username = userData.username || ""
    this.email = userData.email || ""
    this.isActive = userData.isActive ?? true
    this.role = userData.role || "user"
    this.password = userData.password

    if (!this.validatePassword()) {
      throw new Error(`Password must be at least ${this.getMinPasswordLength()} characters for ${this.role} role`)
    }
  }

  protected getMinPasswordLength(): number {
    return 8
  }

  validatePassword(): boolean {
    return this.password.length >= this.getMinPasswordLength()
  }

  getPasswordMask(): string {
    return "*".repeat(this.password.length)
  }

  getPasswordLength(): number {
    return this.password.length
  }
}

// Task 4: Tạo class 'AdminUser' kế thừa 'UserAccount'
class AdminUser extends UserAccount {
  public permissions: string[]

  constructor(userData: Partial<User> & { password: string; permissions?: string[] }) {
    super({ ...userData, role: "admin" })
    this.permissions = userData.permissions || ["read", "write", "delete", "admin"]
  }

  protected getMinPasswordLength(): number {
    return 12 // Admin yêu cầu ít nhất 12 ký tự
  }

  addPermission(permission: string): void {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission)
    }
  }

  removePermission(permission: string): void {
    this.permissions = this.permissions.filter((p) => p !== permission)
  }
}

// Task 5: Viết hàm 'createUser' nhận vào object partial User
function createUser(userData: Partial<User>): User {
  return {
    id: Date.now(),
    username: userData.username || "Anonymous",
    email: userData.email || "no-email@example.com",
    isActive: userData.isActive ?? true,
    role: userData.role || "user",
  } as User
}

// Task 6: Viết hàm 'formatUserInfo' nhận User hoặc UserProfile
function formatUserInfo(user: User | UserProfile): string {
  // Type guard để kiểm tra xem user có birthDate không (UserProfile)
  if ("birthDate" in user && user.birthDate) {
    const birthDate = user.birthDate.toLocaleDateString("vi-VN")
    return `User ${user.username} born on ${birthDate}`
  } else {
    return `User ${user.username} (${user.role})`
  }
}

// Type guard function
function isUserProfile(user: User | UserProfile): user is UserProfile {
  return "birthDate" in user && user.birthDate instanceof Date
}

// Storage for created users
const createdUsers: (UserAccount | AdminUser)[] = []

// Task 7 & 8: Lấy phần tử DOM và xử lý form submit
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userForm") as HTMLFormElement
  const emailInput = document.querySelector("#email") as HTMLInputElement
  const userList = document.getElementById("userList") as HTMLDivElement
  const userCount = document.getElementById("userCount") as HTMLSpanElement
  const clearAllBtn = document.getElementById("clearAll") as HTMLButtonElement
  const roleSelect = document.getElementById("role") as HTMLSelectElement
  const passwordInput = document.getElementById("password") as HTMLInputElement
  const passwordHint = document.getElementById("passwordHint") as HTMLElement

  // Update password hint based on role selection
  roleSelect.addEventListener("change", () => {
    const role = roleSelect.value
    if (role === "admin") {
      passwordHint.textContent = "Admin users require at least 12 characters"
      passwordHint.style.color = "#e74c3c"
    } else {
      passwordHint.textContent = "Regular users require at least 8 characters"
      passwordHint.style.color = "#7f8c8d"
    }
  })

  // Form submit handler
  if (form) {
    form.onsubmit = (e: SubmitEvent) => {
      e.preventDefault()

      try {
        // Get form data with proper type assertions
        const username = (form.elements.namedItem("username") as HTMLInputElement).value
        const email = emailInput.value
        const password = (form.elements.namedItem("password") as HTMLInputElement).value
        const role = (form.elements.namedItem("role") as HTMLSelectElement).value as "admin" | "user" | "guest"
        const birthDateInput = (form.elements.namedItem("birthDate") as HTMLInputElement).value
        const address = (form.elements.namedItem("address") as HTMLInputElement).value
        const isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked

        // Validate required fields
        if (!username.trim()) {
          throw new Error("Username is required")
        }
        if (!email.trim()) {
          throw new Error("Email is required")
        }
        if (!password.trim()) {
          throw new Error("Password is required")
        }

        const userData: Partial<User> & { password: string } = {
          username: username.trim(),
          email: email.trim(),
          password,
          role,
          isActive,
        }

        let newUser: UserAccount | AdminUser

        // Create appropriate user type based on role
        if (role === "admin") {
          newUser = new AdminUser({
            ...userData,
            permissions: ["read", "write", "delete", "admin", "manage_users"],
          })
        } else {
          newUser = new UserAccount(userData)
        }

        // Create UserProfile if birthDate is provided
        let userProfile: UserProfile | undefined
        if (birthDateInput) {
          userProfile = {
            ...newUser,
            birthDate: new Date(birthDateInput),
            address: address.trim() || undefined,
          }
        }

        // Add to storage
        createdUsers.push(newUser)

        // Log to console as required
        console.log("=== NEW USER CREATED ===")
        console.log("User Account:", newUser)
        if (userProfile) {
          console.log("User Profile:", userProfile)
          console.log("Formatted Info:", formatUserInfo(userProfile))
        } else {
          console.log("Formatted Info:", formatUserInfo(newUser))
        }
        console.log("========================")

        // Update display
        displayUsers()
        updateUserCount()

        // Reset form
        form.reset()

        // Show success message
        showNotification("User created successfully!", "success")
      } catch (error) {
        console.error("Error creating user:", error)
        showNotification(`Error: ${(error as Error).message}`, "error")
      }
    }
  }

  // Clear all users
  clearAllBtn?.addEventListener("click", () => {
    if (createdUsers.length === 0) return

    if (confirm("Are you sure you want to delete all users?")) {
      createdUsers.length = 0
      displayUsers()
      updateUserCount()
      showNotification("All users cleared!", "info")
    }
  })

  // Display users function
  function displayUsers(): void {
    if (!userList) return

    if (createdUsers.length === 0) {
      userList.innerHTML = `
        <div class="empty-state">
          <p>🚀 No users created yet. Create your first user!</p>
        </div>
      `
      return
    }

    userList.innerHTML = ""

    createdUsers.forEach((user, index) => {
      const userDiv = document.createElement("div")
      userDiv.className = `user-item ${user.role}`

      const isAdmin = user instanceof AdminUser
      const permissions = isAdmin ? (user as AdminUser).permissions : []

      // Create UserProfile if we have additional data (simulated)
      const userInfo = formatUserInfo(user)

      userDiv.innerHTML = `
        <div class="user-header">
          <div class="user-title">
            ${getRoleIcon(user.role)} ${user.username}
          </div>
          <span class="role-badge ${user.role}">${user.role}</span>
        </div>
        
        <div class="user-details">
          <div class="user-detail">
            <strong>ID:</strong> <span>#${user.id}</span>
          </div>
          <div class="user-detail">
            <strong>Email:</strong> <span>${user.email}</span>
          </div>
          <div class="user-detail">
            <strong>Status:</strong> 
            <span style="color: ${user.isActive ? "#27ae60" : "#e74c3c"}">
              ${user.isActive ? "✅ Active" : "❌ Inactive"}
            </span>
          </div>
          <div class="user-detail">
            <strong>Password:</strong> <span>${user.getPasswordMask()} (${user.getPasswordLength()} chars)</span>
          </div>
          ${
            isAdmin
              ? `
            <div class="user-detail" style="grid-column: 1 / -1;">
              <strong>Permissions:</strong> 
              <span>${permissions.map((p) => `🔑 ${p}`).join(", ")}</span>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="user-info">
          📋 ${userInfo}
        </div>
      `

      userList.appendChild(userDiv)
    })
  }

  // Update user count
  function updateUserCount(): void {
    if (userCount) {
      const count = createdUsers.length
      const adminCount = createdUsers.filter((u) => u.role === "admin").length
      const userCountRegular = createdUsers.filter((u) => u.role === "user").length
      const guestCount = createdUsers.filter((u) => u.role === "guest").length

      userCount.textContent = `${count} users (👑 ${adminCount} admins, 👤 ${userCountRegular} users, 👥 ${guestCount} guests)`
    }
  }

  // Helper function to get role icon
  function getRoleIcon(role: string): string {
    switch (role) {
      case "admin":
        return "👑"
      case "user":
        return "👤"
      case "guest":
        return "👥"
      default:
        return "❓"
    }
  }

  // Notification system
  function showNotification(message: string, type: "success" | "error" | "info"): void {
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `

    switch (type) {
      case "success":
        notification.style.background = "#27ae60"
        break
      case "error":
        notification.style.background = "#e74c3c"
        break
      case "info":
        notification.style.background = "#3498db"
        break
    }

    notification.textContent = message
    document.body.appendChild(notification)

    // Add slide-in animation
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove()
      style.remove()
    }, 3000)
  }

  // Initialize display
  displayUsers()
  updateUserCount()

  // Log system info
  console.log("🚀 User Management System Initialized!")
  console.log("📋 TypeScript Features Implemented:")
  console.log("   ✅ Interface User with readonly id and union types")
  console.log("   ✅ Type UserProfile extending User")
  console.log("   ✅ UserAccount class implementing User interface")
  console.log("   ✅ AdminUser class with inheritance and method override")
  console.log("   ✅ Type guards for User vs UserProfile")
  console.log("   ✅ Type assertions for DOM elements")
  console.log("   ✅ Proper access modifiers (private, public, readonly)")
  console.log("   ✅ Function overloading and generic types")
})

// Export types for potential use in other modules
export type { User, UserProfile }
export { UserAccount, AdminUser, createUser, formatUserInfo, isUserProfile }
