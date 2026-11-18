# Changes I made

This file lists every change I made to Campus Stores and why. The layout, navigation, colours, fonts and existing CSS classes are unchanged. All the work is in `app.js`, plus a few small style rules in `styles.css` that reuse the app's own colour variables.

## The problem I found

I worked the Film Society shift in the original app, and the hard part was not issuing the kit. It was **keeping track of a kit that comes back in pieces**.

- On Friday evening, Kabir returned the projector and speaker but not the adapter. The only place I could record that Leela had it was a free-text desk book note. The slip still said "Kabir Sen".
- On Saturday morning, the new shift had to read the desk book, then match it to the loan register by hand. RQ-214 had no single view of what was still owed.
- When Leela handed in an adapter, I could press **Record return** on any open slip. Nothing checked that the adapter in her hand was AD-12, the one actually lent, and not AD-15 from the same bin (C4).

So the product kept good records of individual slips but had no idea of a **request as a whole**, or of **who has an item now**. My changes fix that.

## What the original app does well (kept)

- **One slip per physical unit.** Each unit is returned and tracked on its own, which is what makes partial returns possible. I kept this, and even multi-unit issuing still makes one slip per unit.
- **Issuing is checked against the approved request.** The app refused equipment types the request didn't approve. I kept and extended this.
- **The desk book.** It's still there for messages that don't fit a field.

---

## Changes

### 1. Requests page is now a checklist per request
**What:** Opening a request shows each approved item with its unit, slip number, who collected it, who has it now, its due time and its status. The request list shows progress for each request, such as "1 of 3 back · 2 still out" or "All back · closed".
**Why:** Before, you had to piece together what a club still owed from separate slips. Now the request answers that directly, which is what the morning shift needs.

### 2. "Still out…" records who has a missing item, when it's due and who said so
**What:** Every open slip has a **Still out…** button. It asks who has the item now, when it's promised back and who told the desk. The answers are saved on the slip, and a handover note is added to the desk book automatically.
**Why:** On Friday, "Leela has the adapter, back at 9 am" only existed as free text. Now it's on the slip itself, so the loan register and inventory show "Now with Leela Das · Due Sat 9 am" without anyone reading the desk book.

### 3. Collected by and Now with are shown separately
**What:** Slips show both "Collected by Kabir Sen" and "Now with Leela Das". Inventory shows who has each loaned unit.
**Why:** The person who collected an item isn't always the person who has it. Staff need to know who to ask for it.

### 4. Returns are checked against the unit label
**What:** **Record return** asks for the label on the item in your hands. The slip closes only if the label matches. A wrong unit is refused with a clear reason, for example "AD-15 is not on loan. It is on shelf C4. Nothing was closed."
**Why:** Before, the wrong slip could be closed. With two identical adapters in one bin, that's an easy mistake, and it leaves the records wrong without anyone noticing.

### 5. "Item handed in" box on the loan register
**What:** At the top of the loan register, you type the label of whatever someone hands you, for example AD-12. The app finds its open slip and closes it, then tells you which request it belonged to and what's still out.
**Why:** On Saturday morning, Leela walks in with an adapter. The fastest correct answer starts from the item, not from searching slips.

### 6. Undo a check-in
**What:** After every check-in, an **Undo** button appears in the status bar. It reopens that slip with the same holder and due time. It disappears as soon as you do anything else, and isn't kept after a page reload.
**Why:** Label checking prevents most mistakes, but a slip could still be closed by accident, and there was no way back. Undo is offered only straight after the check-in, so it can't reopen an old slip by surprise.

### 7. Due and overdue tags, sorted by due time
**What:** Open slips show **Due Fri 8 pm** (highlighted when it's within 3 hours) or **Overdue · was due Fri 8 pm**. The Outstanding view sorts slips by due time, soonest first.
**Why:** The morning shift should see what's expected next, and what's late, at a glance.

### 8. Warning when moving to the next shift
**What:** When you move the desk time forward, the status bar lists every overdue slip, for example "L-404 (AD-12) is overdue." This includes items whose promised time from a follow-up has also passed.
**Why:** A handover is exactly when untracked items get lost. This catches them before the next shift starts, including a missed promise.

### 9. Only named people can collect
**What:** Each request lists who can collect it. For RQ-214 that's Isha Rao, the owner, and Kabir Sen, whom she named in the desk book. Anyone else needs a ticked box saying the owner confirmed. That exception is written to the desk book.
**Why:** Before, anyone could collect any club's equipment, and the only authority was a message you might not read.

### 10. Issue many units at once, one slip each
**What:** The issue form takes several units in one save. You can tick them in a list or type labels such as `PR-04, SP-02, AD-12`, or both. Saving creates one slip per unit, for example "slips L-402 to L-404, one per unit".
- The pick list only shows on-shelf units of the types the request can still have out. A unit that is checked back in no longer counts, so if the wrong unit went out and was taken back, the right one can still be issued.
- The whole save is checked first. If anything is wrong (an unknown label, a unit already out, more units of a type than approved), nothing is issued and the message explains why.
**Why:** Issuing a 10-item kit one item at a time is slow and repetitive. Separate slips mean each unit can still be returned and checked on its own, so partial returns keep working.

### 11. "Issue N remaining" from the request
**What:** A request that isn't fully issued has an **Issue N remaining** button. It opens the issue form with the request chosen, one shelf unit ticked for each item still needed, and the collector filled in if there's only one.
**Why:** At pickup, the job starts from the request. This turns a kit into a single check-and-save.

### 12. Type or pick names and times
**What:**
- **Collected by**, **Who has it now** and **Told to the desk by** are text boxes with suggestions. The suggestions include the standard list plus anyone who has collected, held or reported an item before. Typing "kabir sen" matches "Kabir Sen".
- **Return by** and **Promised back** are text boxes with suggested times. They accept times like `Sat 9 am`, `fri 7:55 pm` or `Sat noon`. If Return by is left blank, the request's approved time is used.
**Why:** Fixed dropdowns couldn't cover a new person or a time like 11:30. Suggestions keep entry fast, and typing covers everything else.

### 13. Return times are checked
**What:** A return time later than the request's approved time is refused, and so is a time that has already passed.
**Why:** Before, the fixed list offered "Sat 9 am" for a request due back on Friday at 8 pm.

### 14. Smaller fixes
- **Saved progress resets once.** The saved-data format changed, so the storage key changed and old saved shifts are ignored rather than loaded wrongly.
- **Request text is escaped** before it's shown, like everything else in the app.
- **Styles.** I added a `.warn` tag (using the app's memo colours), styles for the unit picker and checkboxes, and a margin for the checklist heading. All of it uses the app's existing variables, so it works in light and dark mode.

---

## Walking through the same job with these changes

1. **Friday 3:45 pm, pickup.** Open RQ-214 and choose **Issue 3 remaining**. PR-04, SP-02 and AD-12 are already ticked. Type Kabir Sen and save. Three slips are created, L-402 to L-404.
2. **Friday 7:30 pm, partial return.** Type PR-04 and then SP-02 into **Item handed in**. RQ-214 now shows "2 of 3 back · 1 still out". On AD-12, choose **Still out…** and enter Leela Das, Sat 9 am, reported by Kabir Sen.
3. **Saturday 9:00 am, next shift.** The Outstanding view shows AD-12 at the top: with Leela Das, due Sat 9 am. Leela hands over an adapter, and you type its label. If it's AD-12, slip L-404 closes and RQ-214 shows "All back · closed". If it's AD-15, nothing closes, and the app says AD-15 has been on the shelf all along.

## What I'd watch for at a real counter

At the start of a morning shift that takes over a partial return, I'd check whether **the new staff member closes the right slip without opening the desk book or asking anyone**. I'd also time it from the student arriving to the loan being closed. If staff still go looking for messages, the follow-up fields aren't capturing what matters.
