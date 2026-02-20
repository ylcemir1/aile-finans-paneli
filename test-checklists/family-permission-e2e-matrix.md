# Family Permission E2E Matrix

## Invitation Flow

- [ ] Invite same email twice in same family -> shows "Bu kişiye zaten bekleyen davet var"
- [ ] Invite already-member user -> shows "Bu kişi zaten ailenizde"
- [ ] Invite email with uppercase/lowercase variants -> single normalized pending invite
- [ ] Invite non-registered email -> invite remains pending
- [ ] Register later with invited email -> pending invite visible in "Ailem"
- [ ] Accept pending invite -> member is added, status becomes accepted, `accepted_at` populated
- [ ] Reject pending invite -> status becomes rejected, `rejected_at` populated
- [ ] Cancel pending invite by authorized member -> status becomes canceled, `canceled_at` populated
- [ ] Accept expired invite -> blocked with "Davet süresi dolmuş"

## Permission Flow

- [ ] Member without `can_create_finance` cannot create family-scoped finance rows
- [ ] Member with `can_create_finance` can create family-scoped account/loan/card
- [ ] Member without `can_edit_finance` cannot edit family-scoped account/loan/card/installment
- [ ] Member with `can_edit_finance` can edit family-scoped account/loan/card/installment
- [ ] Member without `can_delete_finance` cannot delete family-scoped finance rows
- [ ] Member with `can_delete_finance` can delete family-scoped finance rows
- [ ] Member without `can_manage_members` cannot remove members / change roles
- [ ] Member with `can_manage_members` can remove members and change roles
- [ ] Member without `can_assign_permissions` cannot update another member permissions
- [ ] Member with `can_assign_permissions` can update another member permissions

## Scope Consistency

- [ ] `scope=personal` only shows rows with `family_id IS NULL`
- [ ] `scope=family` only shows rows with `family_id = my_family_id`
- [ ] Dashboard totals change when scope changes
- [ ] Bank Accounts page obeys scope for list and create actions
- [ ] Loans page obeys scope for list and create actions
- [ ] Credit Cards page obeys scope for list and create actions
- [ ] Installments page obeys scope for list and calendar

## Security / Guardrails

- [ ] Unauthorized direct server action calls are blocked (family + finance actions)
- [ ] Last admin in family cannot be removed
- [ ] Admin permissions cannot be manually reduced from member-permission form
- [ ] Global admin user-management actions do not bypass family permission boundaries
- [ ] Family audit logs are written for invite/member/permission mutations
