# Security Specification & Threat Model

This specification enforces Attribute-Based Access Control (ABAC) and Zero-Trust isolation for the **Balanced Flow** application.

## 1. Data Invariants

1. **User Ownership Isolation**: Users are partitioned strictly by their authenticated UID. No user can read, create, update, or delete another user's tasks or habits.
2. **Path Sanitization**: All path parameters must be validated using alpha-numeric and hyphen regex to prevent path traversal or injection.
3. **Immutable Auditing**: `createdAt` timestamps and author bindings must be permanently immutable after document creation.
4. **Strict Schema Constraints**: No shadow fields are allowed. All values must adhere strictly to predefined type and size limitations (e.g., string lengths).
5. **Temporal Integrity**: All write timestamps must strictly match `request.time` to prevent client-side time-spoofing.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent targeted injection, identity spoofing, and state-violating attacks that must return `PERMISSION_DENIED`:

### Payload 1: Spying on Sibling Users (Identity Injection)
*   **Target**: `/users/victim_user_123/tasks/task_abc`
*   **User Context**: Logged in as `attacker_user_456`
*   **Intent**: Attempting to read another user's task.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 2: Poisoning with Arbitrary JSON Keys (Shadow Field Attack)
*   **Target**: `/users/attacker_user_456/tasks/task_new`
*   **Intent**: Write a task containing an unmapped administrative field `isAdmin: true` to bypass access gates.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 3: Spoofing Creation Timestamps (Temporal Attack)
*   **Target**: `/users/attacker_user_456/tasks/task_new`
*   **Intent**: Post a task with a backdated `createdAt` timestamp.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 4: ID Traversal & Poisoning (Resource Poisoning)
*   **Target**: `/users/attacker_user_456/tasks/sub%2F_path_injection`
*   **Intent**: Create a document using a non-standard ID injection containing backslashes or percent encodings.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 5: Updating Immutable Data (Audit Failure Attack)
*   **Target**: `/users/attacker_user_456/tasks/task_abc`
*   **Intent**: Attempt to update the immutable field `createdAt`.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 6: Size Exhaustion Attack (Denial of Wallet)
*   **Target**: `/users/attacker_user_456/tasks/task_abc`
*   **Intent**: Inject a 5MB string description to inflate Firestore document sizes.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 7: Self-Promotion (Unauthorized Roles Mapping)
*   **Target**: `/users/attacker_user_456`
*   **Intent**: Attempt to write a profile claiming to be an administrator of the application.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 8: Habit Sizing Bomb (Array Inflation Attack)
*   **Target**: `/users/attacker_user_456/habits/habit_xyz`
*   **Intent**: Inject a history array of 5,000 items (limit is 30) to drain client-side memory.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 9: Spoofing Sibling Habits (Cross-user Habit Insertion)
*   **Target**: `/users/victim_user_123/habits/habit_xyz`
*   **User Context**: Logged in as `attacker_user_456`
*   **Intent**: Inject a habit into another user's flow.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 10: Null Identifier Bypasses (Null Injection Protection)
*   **Target**: `/users/ /tasks/task_abc`
*   **Intent**: Access paths by utilizing spaces or null characters.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 11: Spoofed Unverified Email (Unverified Access Bypasses)
*   **Target**: `/users/attacker_user_456`
*   **User Context**: Email address marked is `email_verified = false`.
*   **Intent**: Make authorized writes before establishing email validity.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 12: Empty Title Integrity Violation
*   **Target**: `/users/attacker_user_456/tasks/task_empty`
*   **Intent**: Write a task with an empty title string `""` or non-string format.
*   **Expected Outcome**: `PERMISSION_DENIED`

---

## 3. Representative Tests Definition

Below is a declarative test specification validating that the FireStore ruleset successfully rejects all malicious attempts:

```ts
import { assertFails, assertSucceeds, initializeTestApp } from '@firebase/rules-unit-testing';

describe('Balanced Flow Zero-Trust Database rules', () => {
  it('prevents cross-user reads and writes', async () => {
    const attackerApp = initializeTestApp({ projectId: 'bf-app', auth: { uid: 'attacker_user_456', email_verified: true } });
    const db = attackerApp.firestore();
    
    // Victim Path Reads must fail
    await assertFails(db.doc('users/victim_user_123/tasks/task_abc').get());

    // Victim Path Writes must fail
    await assertFails(db.doc('users/victim_user_123/tasks/task_xyz').set({
      title: 'Hacked Task',
      completed: false,
      status: 'today',
      category: 'Work',
      createdAt: new Date().toISOString()
    }));
  });

  it('prevents non-verified email writes', async () => {
    const unverifiedApp = initializeTestApp({ projectId: 'bf-app', auth: { uid: 'attacker_user_456', email_verified: false } });
    const db = unverifiedApp.firestore();
    
    await assertFails(db.doc('users/attacker_user_456/tasks/task_abc').set({
      title: 'Unverified Task',
      completed: false,
      status: 'today',
      category: 'Work',
      createdAt: new Date().toISOString()
    }));
  });

  it('prohibits immutable fields alteration', async () => {
    const authApp = initializeTestApp({ projectId: 'bf-app', auth: { uid: 'user_789', email_verified: true } });
    const db = authApp.firestore();
    
    // Ensure initial write succeeds
    const taskRef = db.doc('users/user_789/tasks/task_test');
    await assertSucceeds(taskRef.set({
      title: 'Valid Task',
      completed: false,
      status: 'today',
      category: 'Work',
      createdAt: new Date().toISOString()
    }));

    // Update with mismatched createdAt must fail
    await assertFails(taskRef.update({
      title: 'Updated Task',
      createdAt: '2020-01-01'
    }));
  });
});
```
