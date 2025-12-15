
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Login from "../pages/login/page";
import Register from "../pages/register/page";
import Attendance from "../pages/attendance/page";
import Game from "../pages/game/page";
import Offering from "../pages/offering/page";
import QT from "../pages/qt/page";
import Notice from "../pages/notice/page";
import Gallery from "../pages/gallery/page";
import Diary from "../pages/diary/page";
import Bulletin from "../pages/bulletin/page";
import Music from "../pages/music/page";
import Monthly from "../pages/monthly/page";
import Minecraft from "../pages/minecraft/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/attendance",
    element: <Attendance />,
  },
  {
    path: "/offering",
    element: <Offering />,
  },
  {
    path: "/qt",
    element: <QT />,
  },
  {
    path: "/notice",
    element: <Notice />,
  },
  {
    path: "/gallery",
    element: <Gallery />,
  },
  {
    path: "/diary",
    element: <Diary />,
  },
  {
    path: "/bulletin",
    element: <Bulletin />,
  },
  {
    path: "/music",
    element: <Music />,
  },
  {
    path: "/monthly",
    element: <Monthly />,
  },
  {
    path: "/game",
    element: <Game />,
  },
  {
    path: "/minecraft",
    element: <Minecraft />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
