const parseItemProperties = (itemData) => {
  const item = {};
  const regex = /#(\w+):\s*"([^"]*)"|\s*#(\w+):\s*([^,\]]+)/g;
  let match;
  
  while ((match = regex.exec(itemData)) !== null) {
    const key = match[1] || match[3];
    let value = match[2] || match[4];
    
    if (value) {
      value = value.trim();
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = Number(value);
    }
    
    item[key] = value;
  }
  
  return item;
};

export const parseCatalogData = (text) => {
  const items = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('ITEM=[')) {
      try {
        const match = line.match(/ITEM=\[\s*(.+)\s*\]/);
        if (match) {
          const itemData = match[1];
          const item = parseItemProperties(itemData);
          if (item.prodId !== undefined) {
            items.push(item);
          }
        }
      } catch (e) {
        console.warn('Failed to parse item:', line);
      }
    }
  }
  return items;
}; 