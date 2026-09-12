const fs = require('fs');
const path = require('path');

const controllers = [
  'src/modules/activity/activity.controller.ts',
  'src/modules/clients/clients.controller.ts',
  'src/modules/notifications/notifications.controller.ts',
  'src/modules/projects/projects.controller.ts',
  'src/modules/tasks/tasks.controller.ts',
  'src/modules/users/users.controller.ts'
];

for (const file of controllers) {
  const filePath = path.join(__dirname, 'apps/api', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace req.params.SOMETHING with req.params.SOMETHING as string
    // Only if it doesn't already have 'as string'
    content = content.replace(/req\.params\.([a-zA-Z0-9_]+)(?!\s*as\s*string)/g, 'req.params.$1 as string');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  }
}

// Fix auth.service.test.ts
const authTestPath = path.join(__dirname, 'apps/api/src/modules/auth/auth.service.test.ts');
if (fs.existsSync(authTestPath)) {
  let content = fs.readFileSync(authTestPath, 'utf8');
  content = content.replace(/lastActive: new Date\(\),\s*/g, '');
  fs.writeFileSync(authTestPath, content, 'utf8');
  console.log('Fixed auth.service.test.ts');
}

// Fix projects.service.test.ts
const projTestPath = path.join(__dirname, 'apps/api/src/modules/projects/projects.service.test.ts');
if (fs.existsSync(projTestPath)) {
  let content = fs.readFileSync(projTestPath, 'utf8');
  content = content.replace(/status: 'PLANNING' as const/g, "status: 'ACTIVE' as const");
  fs.writeFileSync(projTestPath, content, 'utf8');
  console.log('Fixed projects.service.test.ts');
}
