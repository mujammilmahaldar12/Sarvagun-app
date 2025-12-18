# Sarvagun App - Permissions Guide

## User Categories / Roles

| Category | Description |
|----------|-------------|
| `admin` | Full system access, can manage all features |
| `hr` | HR management, staff management, approvals, extensions |
| `manager` | Team management, leave approvals, view team data |
| `employee` | Standard user, can apply for leaves, view own data |
| `intern` | Limited employee, has internship period |
| `mukadam` | Field supervisor role |

---

## Permission Matrix

### Staff Management (HR Module)
| Feature | Admin | HR | Manager | Team Lead | Employee | Intern |
|---------|-------|-----|---------|-----------|----------|--------|
| View all staff | ✅ | ✅ | ✅ | ❌ (own team) | ❌ | ❌ |
| View staff details | ✅ | ✅ | ✅ | ✅ (team only) | ❌ | ❌ |
| Edit staff | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Activate/Deactivate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add employee | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Hiring & Approvals
| Feature | Admin | HR | Manager | Team Lead | Employee | Intern |
|---------|-------|-----|---------|-----------|----------|--------|
| Invite hire | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View pending hires | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/Reject hire | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit pending hire | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Intern Extensions
| Feature | Admin | HR | Manager | Team Lead | Employee | Intern |
|---------|-------|-----|---------|-----------|----------|--------|
| View Extensions tab | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View interns ending soon | ✅ (all) | ✅ (all) | ❌ | ✅ (team) | ❌ | ❌ |
| View overdue interns | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Send extension email | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Promote intern | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Extend intern period | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Leave Management
| Feature | Admin | HR | Manager | Team Lead | Employee | Intern |
|---------|-------|-----|---------|-----------|----------|--------|
| Apply for leave | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own leaves | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject leaves | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View team leaves | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Reimbursements
| Feature | Admin | HR | Manager | Team Lead | Employee | Intern |
|---------|-------|-----|---------|-----------|----------|--------|
| Submit reimbursement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own requests | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all requests | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Team Lead Detection

User is a Team Lead if:
```javascript
user.is_team_leader === true
// OR
Team.objects.filter(leader=user).exists()
```

---

## How Permissions are Checked

### Backend (Django)
```python
# In views
if request.user.category not in ['admin', 'hr']:
    return Response({'error': 'Access denied'}, status=403)
```

### Frontend (React Native)
```typescript
// Check in component
const { user } = useAuthStore();
const canManage = user?.category === 'admin' || user?.category === 'hr';
const canAccessHireActions = ['admin', 'hr', 'manager'].includes(user?.category) || user?.is_team_leader;
```
