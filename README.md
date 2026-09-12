# Remix of Remix of Kurdish Snakes & Ladders

Project Overview:

I want to build a multiplayer mobile-first web app (a Snakes and Ladders game). Crucial Rule: All frontend UI text, buttons, and labels must be written in the Kurdish language. However, please write the code, variables, and logic in standard English. The overall UI style must be "Glassmorphism" with high-quality, smooth, and elegant animations. 

Here are the specific requirements broken down by features:

1. Authentication & Login UI

* Design: Glassmorphism style. The background must be a high-quality, elegant, and slightly blurred video/animation of real-looking snakes (black, green, and brown colors) moving smoothly.

* Features: A login system with an option to "Login with previous account" (saving credentials so returning users can log in with one tap).

* Routing: First-time users who just registered should be redirected to the "Profile" tab. Returning users who log in should be redirected directly to the "Play" tab.

2. Main Navigation (Bottom Bar)

* Design: A bottom navigation bar with 5 distinct, realistic icons (no emojis). The tabs are: Profile, Friends, Play, Store, Leaderboards.

3. Global Elements

* Gold Counter: A beautiful, circular icon at the top-left of the screen showing the user's total Gold balance. This counter must be visible on all main tabs, but hidden when the user is inside actual Gameplay, Private Chats, Group Chats, or the Profile Menu overlay.

4. Profile Tab & Menu

* Hamburger Menu: A 3-line icon at the top-left. Tapping it opens a full-screen glassmorphism overlay.

* Menu Items: 

  * "Block List" (White text/icon).

  * "Logout" (Red text/icon).

  * "Online Status" toggle: Tapping it switches between Online (Green dot) and Offline (Red dot). 

  * A "Back" icon on the left to close the menu.

5. Friends & Chat System

* Friends List: Shows only accepted friends.

* Unread Badges: A red dot on the "Friends" bottom tab showing total unread messages (e.g., 10). Inside the tab, the red dot appears on the specific sender's profile picture showing their specific unread count (e.g., 3). Reading the chat clears that specific badge.

* Direct Chat: Tapping a friend opens a full-screen chat. Top-left: Friend's name and avatar. Top-right: Back icon. Bottom: Text input field. The "Send" icon should only appear when text is typed into the input field.

* Timestamps: Every message sent/received must have a small time/date stamp below it.

* Blocking: Tapping a friend's avatar opens a small popup with a "Block" icon. Blocked users can't chat or search for the user, and their avatar is hidden (only name remains). They are moved to the "Block List" in the Profile menu. In the Block List, a red trash icon next to them unblocks them.

6. Group Chat System

* UI Switch: Below the top bar in the Friends tab, add two smooth toggle buttons: "Friends" and "Groups" to switch views with nice animations.

* Create Group: A "+" icon at the top-left of the Friends tab. Opens a full-screen friend selector. Tap a friend to select (highlights green), tap again to deselect. Max 4 users per group. Top-right green checkmark to confirm creation.

* Group Design: Distinct chat colors so users don't confuse them with direct chats. Group names at the top.

* Invite Codes: Every group generates a unique 6-digit green code next to the group profile. Tapping it copies the code. Users can paste this code in private chats. If a friend clicks the code, they automatically join the group.

* Leave Group: Tapping a group's avatar opens a small popup with a "Leave" icon.

7. Play Tab (Game Setup)

* Design: Two wide, adjacent icons at the top of the Play tab.

* Token Selector (Left Icon): Has an image of a chess piece/token. Tapping it opens a full-screen overlay showing 10 different playable tokens arranged in 3 columns. Top-left back button. Selecting a token gives it a green border and sets it as the active token.

* Board Selector (Right Icon): Shows a Snakes & Ladders board preview. Tapping it opens a full-screen overlay showing 10 different beautifully colored snake/ladder boards. Top-left back button. Selecting one gives it a green border and sets it as the active board.

8. Store Tab

* Design: Red background for the page. The items should be in distinct black containers, stacked vertically. 

* Layout: Gold amount on the left, Price ($) on the right. 

* Packages: 100 Gold for $0.50, 400 Gold for $2.00, 700 Gold for $4.99, 1100 Gold for $7.99, 1800 Gold for $9.99.

* Payment: Tapping a package should trigger the native In-App Purchase flow (Apple App Store for iOS, Google Play for Android).

9. Leaderboards Tab

* Sub-tabs: Three sections at the top/bottom: "Highest Points" (Left), "Most Gold" (Right), and "Friends Rank" (Middle/Third).

* Logic: Highest Points ranks globally by points. Most Gold ranks globally by gold. Friends Rank sorts only the user's friend list by points.

* Player Stats Modal: Tapping ANY player's name in these leaderboards opens a bottom-sheet modal (taking up half the screen). It displays: Profile picture, Total Games Played, Wins, Losses, and a circular icon at the top-left of the modal showing their Gold balance. Tapping outside the modal closes it automatically.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b28d130b-877b-43c0-97f3-a36be9a71519).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
