# ⚙️ Gearworks

**Gearworks** is a high-octane machine repair arcade game built with Phaser 3. Test your reflexes as an industrial engineer tasked with fixing complex machinery on a rapidly moving conveyor belt. Match parts, manage skills, and build a high-scoring streak across three distinct visual themes!

![Gearworks Gameplay](https://via.placeholder.com/800x450.png?text=Gearworks+Gameplay+Placeholder)

---

## 🚀 Key Features

### 🕹️ Core Gameplay
- **Precision Matching**: Drag missing parts from the tray to the corresponding red slots on incoming machines.
- **Bonus Systems**:
    - **Speed Bonus**: Fix machines early on the belt for extra points.
    - **Perfect Fix**: Earn bonus XP for fixing machines without a single wrong part.
    - **Chain Reactions**: String together consecutive fixes for massive score multipliers.

### 🎭 Visual Themes
Switch between three unique environments, each with its own color palette, background mechanics, and atmospheric effects:
- **🏭 Night Factory**: The classic industrial experience.
- **🌆 Neon Cyber**: A futuristic glow with neon scanlines.
- **🌋 Lava Forge**: High-stakes engineering over a molten landscape.

### ⚡ Power-Ups & Skills
Master three unique skills to survive the higher levels:
- **❄️ Time Freeze**: Stop the belt entirely for 5 seconds to clear a backlog.
- **🐢 Slow-Mo**: Halve the belt speed for 8 seconds for precision work.
- **🔧 Super Wrench**: Automatically fix the nearest machine slot.

### 📈 Progression & Meta
- **Local Leaderboard**: Track your best scores and longest streaks locally.
- **Daily Modifiers**: Every day brings a new challenge (e.g., Boss Rush, Power Surge).
- **Upgrade Shop**: Spend earned XP to increase starting lives, slow down the base belt speed, or speed up skill recharge.
- **Achievements**: 11 unique achievements to unlock based on your performance.

---

## 🛣️ World & Level Progression

Gearworks features a dynamic difficulty engine that reconfigures the factory floor as you advance. Every **3 levels**, the conveyor belt system undergoes a structural shift:

| Level Range | Path Geometry | Description |
|:--- |:--- |:--- |
| **Lv 1 - 3** | **Linear** | Standard horizontal flow. Perfect for building speed bonuses. |
| **Lv 4 - 6** | **S-Curve** | A broad, sweeping cubic bezier curve that tests spatial awareness. |
| **Lv 7 - 9** | **Zig-Zag** | Sharp corners and sudden direction changes for high-speed precision. |
| **Lv 10 - 12**| **Roundabout**| A complex looping path that increases machine density. |
| **Lv 13+** | **Chaos Mode** | Unpredictable spline paths that change with every new level. |

---

## 🎨 Theme System

The game utilizes a procedural theme engine to modify the environment without external asset dependencies:

1. **🏭 Night Factory**: Standard grid with low-latency particle effects and industrial blue/grey aesthetics.
2. **🌆 Neon Cyber**: Implements scanline rendering and high-contrast neon glows with increased particle density.
3. **🌋 Lava Forge**: Overlays a heat-distortion effect and glowing molten particles for a high-intensity feel.

Each theme modifies the **Atmospheric Manager** which controls background gear speeds, ambient light colors, and collision particle properties.

---

## 🛠️ Tech Stack
- **Game Engine**: [Phaser 3](https://phaser.io/)
- **Frontend Framework**: [React](https://reactjs.org/) (for UI components and state)
- **Styling**: Vanilla CSS & [Lucide Icons](https://lucide.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **API Client**: [Axios](https://axios-http.com/) (fully decoupled from proprietary SDKs)

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/gear-shift.git
   cd gear-shift
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   The game works entirely locally by default. If you wish to connect to a custom backend, create a `.env.local` file:
   ```env
   VITE_APP_ID=your_app_id
   VITE_API_URL=your_backend_url
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing
Contributions are welcome! Since this is an open source project under the MIT License, feel free to:
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🏆 Credits
Developed by the **Gearworks Team** for Gamedev.js Jam 2026.
Theme: **MACHINES**.
