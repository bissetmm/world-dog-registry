import { Controller, Get, Header } from "@nestjs/common";
import { dashboardHtml } from "./dashboard.html";
import { dashboardScript } from "./dashboard.script";
import { dashboardStyles } from "./dashboard.styles";

@Controller("dashboard")
export class DashboardController {
  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  getDashboard(): string {
    return dashboardHtml;
  }

  @Get("styles.css")
  @Header("Content-Type", "text/css; charset=utf-8")
  getStyles(): string {
    return dashboardStyles;
  }

  @Get("app.js")
  @Header("Content-Type", "application/javascript; charset=utf-8")
  getScript(): string {
    return dashboardScript;
  }
}
