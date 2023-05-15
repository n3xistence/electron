export const layout = (page) => {
  const defaultStyle = `cursor-pointer p-[25px] w-[100%] h-[75px] rounded-bl-lg border-b-[3px] border-[#2c313e] hover:bg-[#2c313e]`;
  const selectedStyle = `cursor-pointer p-[25px] w-[100%] h-[75px] rounded-bl-lg border-b-[3px] border-[#2c313e] hover:bg-[#2c313e] border-l-[3px] border-l-white`;

  return `
<div class="${page === "home" ? selectedStyle : defaultStyle}"
  id="home-menu-item">
  <i class="fa-solid fa-house !w-[25px]"></i>Home
</div>
<div class="${page === "stats" ? selectedStyle : defaultStyle}"
  id="stats-menu-item">
  <i class="fa-solid fa-chart-column !w-[25px]"></i>Stats
</div>
<div class="${page === "wars" ? selectedStyle : defaultStyle}"
  id="wars-menu-item">
  <i class="fa-solid fa-radiation !w-[25px]"></i>Wars
</div>
<div class="${page === "users" ? selectedStyle : defaultStyle}"
  id="users-menu-item">
  <i class="fa-solid fa-user !w-[25px]"></i>Users
</div>
<div class="${
    page === "settings" ? selectedStyle : defaultStyle
  } absolute bottom-[50px]"
  id="settings-menu-item">
  <i class="fa-solid fa-screwdriver-wrench !w-[25px]"></i>Settings
</div>`;
};
