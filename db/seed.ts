/**
 * BikeSense — Database Seed Script
 * Run: npx ts-node seed.ts
 */

import { PrismaClient, BikeType, BikeStatus, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

const areas = [
  { name:"Indiranagar Hub",  area:"Indiranagar",   lat:12.9784, lng:77.6408 },
  { name:"Koramangala Hub",  area:"Koramangala",   lat:12.9352, lng:77.6245 },
  { name:"Whitefield Hub",   area:"Whitefield",    lat:12.9698, lng:77.7500 },
  { name:"HSR Layout Hub",   area:"HSR Layout",    lat:12.9116, lng:77.6389 },
  { name:"Electronic City",  area:"Electronic City",lat:12.8456, lng:77.6603 },
];

const bikeModels = [
  {model:"Ather 450X",   type:BikeType.EV,     pricePerHr:81, battery:85, range:85},
  {model:"Bounce Infinity",type:BikeType.EV,   pricePerHr:69, battery:75, range:70},
  {model:"Yulu Move",    type:BikeType.EV,     pricePerHr:45, battery:90, range:40},
  {model:"Honda Activa", type:BikeType.SCOOTER,pricePerHr:55, battery:null, range:null},
  {model:"Royal Enfield",type:BikeType.PREMIUM,pricePerHr:120,battery:null, range:null},
  {model:"Rapido Bike",  type:BikeType.BUDGET, pricePerHr:38, battery:null, range:null},
];

async function main() {
  console.log("🌱 Seeding BikeSense database...\n");

  // Admin user + company
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@bikesense.ai" },
    update: {},
    create: {
      clerkId:   "seed_admin_001",
      email:     "admin@bikesense.ai",
      firstName: "Fleet",
      lastName:  "Manager",
      role:      "ADMIN",
    },
  });
  console.log("✅ Admin user created");

  const company = await prisma.company.upsert({
    where:  { userId: adminUser.id },
    update: {},
    create: {
      name:   "BangBikes Pvt Ltd",
      userId: adminUser.id,
      plan:   "GROWTH",
    },
  });
  console.log("✅ Company created:", company.name);

  // Branches
  const branches = await Promise.all(
    areas.map(a => prisma.branch.upsert({
      where:  { id: `branch_${a.area.replace(/ /g,"_")}` },
      update: {},
      create: {
        id:        `branch_${a.area.replace(/ /g,"_")}`,
        companyId: company.id,
        name:      a.name,
        area:      a.area,
        latitude:  a.lat,
        longitude: a.lng,
      },
    }))
  );
  console.log(`✅ ${branches.length} branches created`);

  // Bikes — 8 per model per branch
  let bikeCount = 0;
  for (const branch of branches) {
    for (const bm of bikeModels) {
      for (let i = 0; i < 8; i++) {
        const statuses = [BikeStatus.AVAILABLE, BikeStatus.AVAILABLE, BikeStatus.AVAILABLE,
                          BikeStatus.IN_USE, BikeStatus.IN_USE, BikeStatus.AVAILABLE,
                          BikeStatus.MAINTENANCE, BikeStatus.AVAILABLE];
        await prisma.bike.create({
          data: {
            companyId:  company.id,
            branchId:   branch.id,
            model:      bm.model,
            type:       bm.type,
            status:     statuses[i],
            batteryPct: bm.battery ? bm.battery - Math.floor(Math.random()*30) : null,
            rangeKm:    bm.range,
            pricePerHr: bm.pricePerHr,
            latitude:   branch.latitude  + (Math.random()-0.5)*0.01,
            longitude:  branch.longitude + (Math.random()-0.5)*0.01,
          },
        });
        bikeCount++;
      }
    }
  }
  console.log(`✅ ${bikeCount} bikes created`);

  // Consumer users
  const consumers = await Promise.all(
    Array.from({length:5}).map((_,i) =>
      prisma.user.upsert({
        where:  { email: `rider${i+1}@example.com` },
        update: {},
        create: {
          clerkId:   `seed_consumer_00${i+1}`,
          email:     `rider${i+1}@example.com`,
          firstName: ["Arjun","Priya","Ravi","Meera","Kiran"][i],
          lastName:  ["Kumar","Nair","Sharma","Iyer","Reddy"][i],
          role:      "CONSUMER",
        },
      })
    )
  );
  console.log(`✅ ${consumers.length} consumer users created`);

  // Rewards
  await Promise.all(consumers.map((c,i) =>
    prisma.reward.upsert({
      where:  { id: `reward_${c.id}` },
      update: {},
      create: {
        id:      `reward_${c.id}`,
        userId:  c.id,
        points:  [1240, 380, 2100, 750, 90][i],
        tier:    ["GOLD","BRONZE","PLATINUM","SILVER","BRONZE"][i] as any,
      },
    })
  ));
  console.log("✅ Rewards seeded");

  // Sample price logs
  const surges = [1.0, 1.08, 1.17, 1.25];
  const logs = [];
  for (let day = 0; day < 7; day++) {
    for (let hr = 0; hr < 24; hr++) {
      const surge = hr>=7&&hr<=9||hr>=17&&hr<=20 ? 1.25 : hr>=10&&hr<=15 ? 1.0 : 1.08;
      for (const area of ["Indiranagar","Koramangala","Whitefield"]) {
        const d = new Date();
        d.setDate(d.getDate()-day);
        d.setHours(hr,0,0,0);
        logs.push({
          area, loggedAt: d,
          basePrice: 65, surgeMultiplier: surge,
          finalPrice: parseFloat((65*surge).toFixed(2)),
          demandLevel: surge===1.25?"Very High":surge===1.17?"High":surge===1.08?"Moderate":"Low",
        });
      }
    }
  }
  await prisma.priceLog.createMany({ data: logs, skipDuplicates: true });
  console.log(`✅ ${logs.length} price logs seeded`);

  console.log("\n🎉 Seed complete! Database ready for BikeSense.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
