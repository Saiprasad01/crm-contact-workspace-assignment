import { faker } from '@faker-js/faker';
import { db } from '../src/db/client';
import { createContact } from '../src/services/contact.service';
import { recordActivity } from '../src/services/activity.service';
import { addTagToContact } from '../src/services/tag.service';

const TAG_NAMES = ['Lead', 'Customer', 'VIP', 'Prospect', 'Partner', 'Churned'];
const COMPANIES = [
  'Acme Corp',
  'Globex Inc',
  'Initech',
  'Umbrella Co',
  'Stark Industries',
  'Wayne Enterprises',
  'Hooli',
  'Soylent Corp',
  'Vandelay Industries',
  'Wonka Co',
];

const CONTACT_COUNT = 220;

function main() {
  console.log('Clearing existing data...');
  db.exec('DELETE FROM activity; DELETE FROM contact_tags; DELETE FROM contacts; DELETE FROM tags;');

  console.log(`Creating ${CONTACT_COUNT} contacts...`);
  for (let i = 0; i < CONTACT_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // ~5% have no email at all, to exercise "unique when present" rather than "always unique".
    const hasEmail = i % 20 !== 0;

    const contact = createContact({
      firstName,
      lastName,
      // Index-salted domain so 220 faker-generated addresses never collide on the unique constraint.
      email: hasEmail
        ? faker.internet.email({ firstName, lastName, provider: `seed${i}.example.com` }).toLowerCase()
        : null,
      phone: i % 10 !== 0 ? `+1${faker.string.numeric(10)}` : null,
      company: i % 7 !== 0 ? faker.helpers.arrayElement(COMPANIES) : null,
      createdAt: faker.date.past({ years: 2 }).toISOString(),
    });

    const chosenTags = faker.helpers.arrayElements(TAG_NAMES, faker.number.int({ min: 0, max: 3 }));
    for (const tagName of chosenTags) {
      addTagToContact(contact.id, tagName);
    }

    // Sprinkle in some pre-existing activity history so the activity feed isn't empty on first load.
    if (i % 15 === 0) {
      recordActivity(contact.id, 'CONTACT_UPDATED', { changedFields: ['phone'] });
    }
  }

  console.log(`Seeded ${CONTACT_COUNT} contacts and ${TAG_NAMES.length} tags.`);
}

main();
