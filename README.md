# Decibel.fun - CokeMusic Catalog

A beautiful, interactive catalog and analytics dashboard for CokeMusic items and possessions, featuring smooth animations and a modern Coca-Cola-inspired design.

## Features

- 📦 **Interactive Catalog**: Browse and search through CokeMusic items with detailed information
- 📊 **Analytics Dashboard**: Visualize purchase data with beautiful charts and filters
- 🎨 **Smooth Animations**: Custom Coca-Cola style ribbon wave animation
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔍 **Advanced Search**: Search by item name, category, or description
- 📈 **Real-time Data**: Fetches live data from CokeMusic APIs

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom animations
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for beautiful icons
- **Build Tool**: Vite for fast development and optimized builds

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cokeitems
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

```
cokeitems/
├── public/                 # Static assets
│   ├── fonts/             # Custom Coca-Cola fonts
│   └── icons/             # Item icons
├── src/
│   ├── App.jsx            # Main application component
│   ├── data/
│   │   └── imageBaseMap.js # Image mapping configuration
│   ├── index.css          # Global styles and animations
│   └── main.jsx           # Application entry point
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── postcss.config.js      # PostCSS configuration
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deployment Options

#### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy!

#### Vercel
1. Connect your repository to Vercel
2. Vercel will automatically detect it's a Vite project
3. Deploy!

#### GitHub Pages
1. Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/your-repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```
2. Install gh-pages: `npm install --save-dev gh-pages`
3. Deploy: `npm run deploy`

#### Traditional Web Server
1. Run `npm run build`
2. Upload the contents of the `dist/` folder to your web server
3. Ensure your server is configured to serve `index.html` for all routes (SPA routing)

## Environment Variables

If you need to configure API endpoints or other environment variables, create a `.env` file:

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_CATALOG_URL=https://your-catalog-endpoint.com
```

## Customization

### Colors and Branding
The Coca-Cola red theme can be customized in `tailwind.config.js` and `src/index.css`.

### Animations
The wave animation is defined in `src/index.css` under the `.coke-wave` class.

### Data Sources
Update the API endpoints in `src/App.jsx` to point to your data sources.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For questions or issues, please contact the development team. 